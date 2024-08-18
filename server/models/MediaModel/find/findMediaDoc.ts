import { Model } from '../../../schemas/schemaTypes';
import { AuthenticatedRequest } from '../../../controllers/controller.interface';
import { ServerResponse } from 'http';
import { Document } from 'mongoose';
import { MultiMediaModel } from '../save/saveMediaDoc';
import { StreamContent, StreamResponse } from '../../helpers/streamResponse';
import {
  MediaMicroserviceCallback,
  MediaMicroserviceFallback,
  MediaResponse,
} from '../../helpers/types';
import { mutateObject } from '../../helpers/mutations';
import { microCall } from '../../../controllers/microController.interface';
const debug = require('debug')('MediaDocument-Query');

export class MediaDocument extends MultiMediaModel {
  constructor(
    req: AuthenticatedRequest,
    res: ServerResponse,
    model: typeof Model
  ) {
    super(req, res, model);
  }

  /**
   * Stream Query Chunks
   * @param filters
   * @param project
   * @param options
   * @returns
   */
  find = async (
    filters?: { [key: string]: any },
    project?: { [key: string]: any } | string | string[],
    options?: { [key: string]: any }
  ) =>
    this.__find(filters, project, options)
      .then((docs: Document[] = []) =>
        Promise.allSettled(
          docs.map((doc: Document, idx: number) => {
            try {
              // Bad Data
              const doc_obj = doc.toObject();
              return this.__resolveDocumentMedia(doc_obj);
            } catch (e) {
              return new Promise((resolve) => {
                const err_stream = new StreamResponse(this.res, {
                  progress: idx / this.content_length,
                  data: null,
                  message: `Failed to serialize ${this.name}`,
                  error: e,
                });
                err_stream.write();
                resolve(null);
              });
            }
          })
        )
      )
      .then((__resolved_documents_for_debug) => {
        // Stream last chunk containing Document w/ uploaded media.
        let final_stream = new StreamResponse(this.res, {
          progress: 1,
          // Include Document Count
          length: this.content_length - 1,
          message: `Query stream finished, ${this.content_length - 1} ${
            this.name
          } document(s) returned.`,
        });
        final_stream.end();
      })
      .catch((err) => {
        // Catch all abruptly end stream.

        debug(`Abruptly ended ${this.name} query stream`, err);

        let err_stream = new StreamResponse(this.res, {
          progress: 1,
          message: `Query failed, ${this.name} document(s) returned 0.`,
          error: err,
        });
        err_stream.end();
      });

  /**
   * Decorated Successful Media Microservice Response
   * @param doc
   * @returns Document w/ Resolved Media
   */
  __get_media_success =
    (doc: Document): MediaMicroserviceCallback<void> =>
    ({ data }: { data: MediaResponse[] }) => {
      // Chunk Content
      let stream_content;
      this.__increment_files();
      stream_content = new StreamContent(
        this.progress,
        `${this.name} Query: ${this.upload_progress} of ${
          this.content_length - 1
        }`
      );

      try {
        // Insert Resolved Media
        if (data) {
          data.forEach((med: MediaResponse) => {
            const {
              metadata: { path: doc_path },
            } = med;
            mutateObject(doc, med, doc_path);
          });
        }
        // Update stream chunk w/ mutated document
        stream_content.update({ data: doc });
      } catch (e: any) {
        debug('Error following successful media resolution.', e);
        // Update stream chunck w/ document(-resolved_media)(+err)
        stream_content.update({
          error: e as Error,
          data: doc,
          message: 'Failed to resolve media.',
        });
      } finally {
        stream_content.update({ data: doc });
        // Stream has idx arg
        if (this.res.headersSent) {
          const down_stream = new StreamResponse(this.res, stream_content);
          down_stream.write();
        } else {
          return doc;
        }
      }
    };

  /**
   * Decorated Unsuccessful Media Microservice Response
   * @param doc
   * @returns Document w/o Resolved Media
   */
  __get_media_failute =
    (doc: Document): MediaMicroserviceFallback<void> =>
    (err: Error) => {
      // Return Document w|w/o Media
      const err_message = `Failed to retrieve ${this.name} media.`;

      // Log Media err
      debug(err_message, err);

      // Stream has idx arg
      if (this.res.headersSent) {
        this.__increment_files();
        let err_stream = new StreamResponse(this.res, {
          progress: this.progress,
          data: doc,
          error: err_message,
          message: `${this.name} Query: ${this.upload_progress} of ${
            this.content_length - 1
          }`,
        });

        err_stream.write();
      } else {
        return doc;
      }
    };

  /**
   * Resolve document media Promise.
   * @param doc
   * @returns Promise<Document w | w/o resolved media>.
   */
  __resolveDocumentMedia = (doc: Document) =>
    // Call MediaMicroservice to resolve media
    microCall(process.env.MEDIA_MICROSERVICE as string, {
      method: 'GET',
      query: { doc: this.model.modelName, doc_id: doc.id },
      headers: new Headers(),
      timeout: parseInt(process.env.MICRO_TIMEOUT as string, 10),
    })
      .then(this.__get_media_success(doc))
      .catch(this.__get_media_failute(doc));

  /**
   * Base Mongoose Query (find)
   * 1. Query
   * 2. Write Head
   * @param filters
   * @param project
   * @param options
   * @returns Document | Document[] | null
   */
  __find = async (
    filters?: { [key: string]: any },
    project?: { [key: string]: any } | string | string[],
    options?: { [key: string]: any }
  ): Promise<Document[] | undefined> =>
    this.model
      .find(filters, project, options)
      .then((docs) => {
        // Set Content Length Query.length + Final Message;
        this.content_length = docs?.length + 1;
        if (this.content_length) {
          this.__writeHead();
          return docs;
        } else {
          return undefined;
        }
      })
      .catch((err: Error) => {
        // Stream last chunk containing Document w/ uploaded media.
        let err_stream = new StreamResponse(this.res, {
          progress: 1,
          message: `Failed to execute ${this.name} query.`,
          error: err?.message,
        });
        err_stream.end();
      });

  /**
   * Find By Id + Resolve Media
   * @param _id
   * @returns application/json
   */
  findById = async (_id: string | { id: string }): Promise<Document | null> => {
    let doc_id;
    switch (typeof _id) {
      case 'object':
        const { id } = _id;
        doc_id = id;
        break;
      case 'string':
        doc_id = _id;
        break;
      default:
        throw new Error(
          `Unexpected argument ${typeof _id}, expected string | {id: string}.`
        );
    }
    return this.model.findById(doc_id).then((doc) => {
      if (doc) {
        return this.__resolveDocumentMedia(doc.toObject());
      } else {
        return new Promise((resolve) => resolve(null));
      }
    });
  };
}
