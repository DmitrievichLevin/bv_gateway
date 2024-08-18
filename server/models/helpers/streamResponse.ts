import { ServerResponse } from 'http';
import { StreamResponseOptions, StreamResponseContent } from './types';
import { streamContentRegex } from '../../schemas/validation/regex';
const debug = require('debug')('stream-response-handler');

/**
 * @class Stream Response (One-Shot)
 * @param {ServerResponse} res
 * @param {StreamResponseContent} props
 * @param {Boolean} failFast - End Stream on error, defaults to false.
 */
export class StreamResponse {
  constructor(
    res: ServerResponse,
    props: StreamResponseContent<any>,
    opts: StreamResponseOptions = {}
  ) {
    // Opts
    const { failFast = false } = opts;
    this.fail = failFast;

    this.res = res;

    this.__serializeChunk(props);
  }

  __serializeChunk = (raw: StreamResponseContent<any> | StreamContent) => {
    try {
      const {
        progress,
        message = undefined,
        data = undefined,
        error = undefined,
      } = raw;

      // Check for instanceof StreamContent
      const content =
        raw instanceof StreamContent
          ? raw
          : new StreamContent(progress, message, data, error);

      this.chunk = content.json();
    } catch (e) {
      debug('Unable to serialize chunk', e);
      debug('Falied chunk: ', raw);

      const err_cont = new StreamContent(
        this.fail ? 1 : raw.progress,
        'Failed to serialize chunk.',
        undefined,
        e?.message
      );

      this.chunk = err_cont.json();
      // End Stream if failFast
      this.write(this.fail);
    }
  };

  __flush = () => {
    this.res = null;
    this.chunk = '';
  };

  /**
   * On-Shot write
   * - Flushed after
   */
  write = (end: boolean = false) => {
    if (this.res) {
      this.res.write(this.chunk);
      if (end) this.res.end();
      this.__flush();
    } else {
      debug('Response has already been written.');
    }
  };

  end = () => {
    this.write(true);
  };

  fail: boolean;
  res: ServerResponse | null;
  chunk: string;
}

export class StreamContent implements StreamResponseContent<any> {
  constructor(
    progress: number,
    message?: string,
    data?: any,
    error?: Error | string
  ) {
    this.update({ progress, message, data, error });
  }

  get error(): string | undefined {
    return this.__err;
  }

  set error(err: string | Error | undefined) {
    if (err instanceof Error) {
      this.__err = err.message;
    } else {
      this.__err = err as string;
    }
  }

  update(content: {
    progress?: number;
    message?: string;
    data?: any;
    error?: Error | string;
  }) {
    for (var c in content) {
      var content_opts = new RegExp(streamContentRegex);
      if (content_opts.test(c)) {
        var value = content[c];
        switch (true) {
          case c === 'progress' && typeof value === 'number':
            this.progress = value;
            break;
          case c === 'message' && typeof value === 'string':
            this.message = value;
            break;
          case c === 'error' &&
            (typeof value === 'string' || value instanceof Error):
            this.error = value;
            break;
          case c === 'data':
            this.data = value;
            break;
          default:
            if (value) {
              let err_message = `Invalid Stream Content\nProperty: ${c}\ntype: ${typeof value}\nvalue: ${value}`;
              throw new Error(err_message);
            }
        }
      }
    }
  }

  json(): string {
    let _json = { progress: this.progress };
    ['message', 'data', 'error'].forEach((p) => {
      var prop = this[p];
      if (prop) {
        _json[p] = prop;
      }
    });
    return JSON.stringify(_json);
  }

  progress: number;
  message?: string;
  data?: any;
  __err?: string;
}
