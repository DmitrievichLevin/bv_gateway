import { ServerResponse } from 'http';
import { AuthenticatedRequest } from '../../../controllers/controller.interface';
const multipart = require('parse-multipart-data');
const debug = require('debug')('Multipart-Deserializer');

type MultiPartItem = {
  filename?: string;
  // name in front-end type FormField
  name: string;
  data: BinaryData;
};

type DocumentPath = string;
type MediaKey = string;

export type MediaUploadArgs = [MediaKey] | [MediaKey, DocumentPath];

type DeserializedParts = {
  files: MediaUploadArgs[];
} & { [key: string]: string | MediaUploadArgs[] | undefined };

/**
 * Multipart/form-data Deserializer
 */
export class MultipartDeserializer {
  constructor(req: AuthenticatedRequest, res: ServerResponse) {
    this.req = req;
    this.res = res;

    debug('Boundary: ', req.headers['content-type']);
    this.boundary = req.headers['content-type'];
  }

  get files() {
    return this.__parts.files;
  }

  /**
   * Amount of files in request.
   */
  get fileCount(): number {
    return this.__parts.files.length;
  }

  set boundary(content_type: string | undefined) {
    if (content_type?.includes('multipart/form-data')) {
      this.__boundary = content_type
        .replace('multipart/form-data; boundary=', '')
        .trim();

      this.parts = multipart.parse(this.req.body, this.__boundary);
    }
  }

  set parts(multi: any) {
    debug('Parsing deserialized multipart.');
    (multi as MultiPartItem[]).forEach(({ filename = null, name, data }) => {
      switch (true) {
        // Non-File
        case !filename && /[a-zA-Z]/g.test(name):
          this.__parts[name] = data.toString() || undefined;
          break;
        case /^(image|file|video)$/.test(name):
          this.__parts.files.push([name]);
          break;
        case /^(image|file|video)s\d$/.test(name):
          let path = name.split(/(\d.*)/, 2).join('.');
          this.__parts.files.push([name, path]);
          break;
        default:
          throw new Error(
            `Invalid Form key, Expected alphanumeric characters, but found ${name}`
          );
      }
    });
  }

  get parts() {
    return this.__parts;
  }

  req: AuthenticatedRequest;
  res: ServerResponse;

  private __boundary: string;
  private __parts: DeserializedParts = { files: [] as MediaUploadArgs[] };
}
