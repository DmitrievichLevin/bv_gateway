import { Model } from '../../../schemas/schemaTypes';
import { microCall } from '../../../controllers/microController.interface';

import { ServerResponse } from 'http';
import { Document } from 'mongoose';
import { AuthenticatedRequest } from '../../../controllers/controller.interface';
import {
  MediaResponse,
  SavedDocument,
  SettledMediaPromise,
  UserDocument,
} from '../../helpers/types';
import { StreamResponse } from '../../helpers/streamResponse';
import { mutateObject } from '../../helpers/mutations';
import {
  MediaUploadArgs,
  MultipartDeserializer,
} from '../../helpers/deserializers/multipartdeserializer';
import { FormatSyncValidationError } from '../../helpers/deserializers/validationErrDeserializer';

const debug = require('debug')('MultimediaDocument-handler');

/**
 * MultiMedia Document
 * @summary - multipart detection: Saves files on document that succeed upload
 * and streams upload process/result.
 * - Processes non-multipart/JSON requests normally
 * @param req
 * @param res
 * @param model
 * @method save
 * @returns {SavedDocument} Saved Document w/ ?Media_Uploads
 */
export class MultiMediaModel extends MultipartDeserializer {
  constructor(
    req: AuthenticatedRequest,
    res: ServerResponse,
    model: typeof Model
  ) {
    // Deserialize multipart
    super(req, res);

    this.user = req.authenticated_user;

    this.model = model;
  }

  set model(mod: typeof Model) {
    // Initialize name of collection
    this.name = mod.modelName[0].toUpperCase() + mod.modelName.slice(1);

    // Extract document attrs from parent class
    Object.keys(mod.schema.obj).forEach((key) => {
      this.attributes = { ...this.attributes, [key]: this.parts?.[key] };
    });

    this.__model = mod;
  }

  get model() {
    return this.__model;
  }

  set user(u: UserDocument) {
    this.__user = u;
  }

  get user() {
    return this.__user;
  }

  get user_id() {
    return this.__user?.id;
  }

  get isStream() {
    let _stream = this.fileCount > 0;

    // Set Micro Headers
    if (_stream && !this.micro_headers) {
      this.__set_headers();
    }

    return _stream;
  }

  __set_headers() {
    this.micro_headers = new Headers();
    this.micro_headers.set(
      'content-type',
      this.req.headers['content-type'] as string
    );
  }

  get progress() {
    return this.__progress / this.content_length;
  }

  /**
   * Increment stream progress
   */
  __increment = () => {
    this.__progress += 1;
  };

  get upload_progress() {
    return this.__upload_progress;
  }

  /**
   * Increment file upload progress
   * - Increments progress as well
   */
  __increment_files = () => {
    this.__increment();
    this.__upload_progress += 1;
  };

  __writeHead = () => {
    this.res.writeHead(200, {
      'Content-Type': this.content_type,
      'Transfer-Encoding': this.encoding,
      'Content-Length': this.content_length,
    });
  };

  /**
   * Save MultiMedia Document
   * @returns {SavedDocument} saved_document
   */
  save = async (): Promise<SavedDocument | null> =>
    new Promise(async (resolve, reject) => {
      // Restrict unauthenticated saves
      if (!this.user_id) {
        debug('Unauthenticated user attempting to save multimedia document.');
        reject('Must be logged on to do that.');
        return;
      }

      // Determine if stream | json response
      this.content_length = this.fileCount * 2 + this.required_processes;
      if (this.isStream) this.__writeHead();
      this.document = new this.model(this.attributes);

      this.__validateDoc()
        .then((doc) => {
          this.saved_document = doc;
          return this.__upload_all();
        })
        .then(() => resolve(this.saved_document))
        .catch((e) => {
          if (this.isStream) this.__error_out_stream(e);
          reject(e);
        });
    });

  /**
   * Abruptly end stream.
   * @param e
   */
  __error_out_stream(e: Error) {
    let error_stream = new StreamResponse(this.res, {
      progress: 1,
      error: e?.message || `${e}`,
    });
    error_stream.end();
  }

  /**
   * Validates & Saves Document
   */
  __validateDoc = async (): Promise<UserDocument> => {
    let saved;

    // Start Stream when files
    if (this.isStream) {
      this.__increment();
      let start_stream = new StreamResponse(this.res, {
        progress: this.progress,
        message: `Validating ${this.name}...`,
      });
      start_stream.write();
    }

    const err = this.document.validateSync();

    if (err) {
      const msg = FormatSyncValidationError(this.name, err);
      // Throw Error for Top-Level Decorator
      throw new Error(msg);
    }
    saved = await this.__save();

    return saved;
  };

  __save = (): Promise<UserDocument> => {
    // Save Valid Document
    return this.document.save().then((doc): SavedDocument => {
      this.__increment();
      let saved_stream = new StreamResponse(this.res, {
        progress: this.progress,
        message: `Saved ${this.name}, ${this.fileCount} files(s) detected...`,
      });
      saved_stream.write();
      return doc.toObject();
    });
  };

  __insert_uploaded_media = (settled: SettledMediaPromise[]) => {
    // Successful attachments
    let attached = 0;

    // Insert successful uploads
    settled.forEach(
      ({ status, value = null, reason = null }: SettledMediaPromise) => {
        if (status === 'fulfilled') {
          const {
            metadata: { path },
          } = value as MediaResponse;

          try {
            // Insert resolved media @ document path.
            mutateObject(this.saved_document as SavedDocument, value, path);
            // Count successful attachments.
            attached += 1;
          } catch (e) {
            debug(
              `Failed to update ${this.name} document[id=${
                (this.saved_document as SavedDocument).id
              }] with media.\n${e}`
            );
          }
        } else {
          debug(`Media Upload failed reason: ${reason}`);
        }
      }
    );

    // Stream last chunk containing Document w/ uploaded media.
    let final_stream = new StreamResponse(this.res, {
      progress: 1,
      data: this.saved_document as SavedDocument,
      message: `Created ${this.name}, attached ${attached} of ${this.fileCount} files.`,
    });
    final_stream.end();
  };

  /**
   * Upload Media Attachment(s)
   * @returns {Promise<void | SettledMediaPromise[]>}
   */
  __upload_all = (): Promise<void | SettledMediaPromise[]> => {
    return (
      Promise.allSettled(
        this.files.map((args: MediaUploadArgs) => {
          return this.__uploadMedia(args) as Promise<MediaResponse>;
        })
      )
        .then(this.__insert_uploaded_media)
        /**
         * Fault Tolerance:
         * - End stream with error
         */
        .catch((err) => {
          let final_err_stream = new StreamResponse(this.res, {
            progress: 1,
            data: this.saved_document as SavedDocument,
            error: err.message,
          });
          debug(`Abrupt end of stream while uploading media\nreason: ${err}`);
          final_err_stream.end();
        })
    );
  };
  __upload_success = (idx: number) => (data: any) => {
    this.__increment();
    let success_stream = new StreamResponse(this.res, {
      progress: this.progress,
      data: data,
      message: `Uploaded media ${idx} of ${this.fileCount}...`,
    });

    success_stream.write();
    return data;
  };

  __upload_fail = (idx: number) => (err: any) => {
    this.__increment();
    let err_stream = new StreamResponse(this.res, {
      progress: this.progress,
      error: `Media upload ${idx} of ${this.fileCount} failed.`,
      message: err?.message,
    });
    debug('Failed to upload media', err);
    err_stream.write();
    throw err;
  };

  __uploadMedia = (args: MediaUploadArgs) => {
    const [key, path = undefined] = args;
    this.__increment_files();
    let up_stream = new StreamResponse(this.res, {
      progress: this.progress,
      message: `Processing media ${this.upload_progress} of ${this.fileCount}...`,
    });
    up_stream.write();
    return microCall(process.env.MEDIA_MICROSERVICE as string, {
      method: 'POST',
      query: {
        id: this.user_id,
        doc: this.model.modelName,
        doc_id: this.document.id,
        doc_path: path || key,
        mediaKey: key,
      },
      headers: this.micro_headers,
      body: this.req.body,
      timeout: parseInt(process.env.MICRO_TIMEOUT as string, 10),
    })
      .then(this.__upload_success(this.upload_progress))
      .catch(this.__upload_fail(this.upload_progress));
  };

  // User Info
  private __user: { id: string; [key: string]: any };

  // Media Micro Headers
  micro_headers: Headers;

  /**
   * Progress of JSON Stream
   */
  private __progress: number = 0;
  /**
   * Progress of Uploads
   */
  private __upload_progress: number = 0;
  /**
   * Media Count
   */
  media: { [key: string]: boolean | number };
  /**
   * Total amount of Streamed JSON objects.
   */
  content_length: number;
  encoding: string = 'chunked';
  content_type: string = 'application/stream+json';
  /**
   * Processes other than File uploads
   * - included in progress measurement.
   */
  required_processes: number = 3;
  /**
   * Name of collection
   */
  name: string;
  /**
   * Initialized Mongoose Model
   */
  private __model: typeof Model;
  /**
   * Deserialized Document Attributes
   */
  attributes: { [key: string]: any } = {};
  /**
   * Mongo Document Instance
   */
  document: Document;
  /**
   * Mongo Saved Document Object
   */
  saved_document: SavedDocument | null = null;
}
