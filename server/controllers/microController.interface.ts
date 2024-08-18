import { ControllerFactory } from './controller.interface';
const debug = require('debug')('micro-controller');
type MicroCallOpts = {
  headers?: Headers;
  timeout: number;
  body?: any;
  method: string;
  query?: { [key: string]: string };
};
export const microCall = async (url: string, opts: MicroCallOpts) => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort('Microservice took too long to respond.'),
    opts.timeout
  );

  // Serialize query params
  let paramString = Object.keys(opts?.query as Object).length
    ? `?${new URLSearchParams(opts.query).toString()}`
    : '';

  const response = await fetch(`${url}${paramString}`, {
    headers: opts.headers,
    body: opts?.body,
    method: opts.method,
    signal: controller.signal,
  }).then(async (res) => {
    // respond 500 for status outside of ~200
    if (res.status > 299 || res.status < 200) {
      const { message = 'Unknown Error in Service request.' } =
        await res.json();
      throw new Error(message);
    }
    return res.json();
  });
  return response;
};
async function micro_method(req, _) {
  // MicroService call headers
  const headers = new Headers();
  headers.set('content-type', req.headers['content-type']);

  const response = microCall(this.url, {
    ...req,
    headers,
    timeout: this.timeout,
  });
  return response;
}

export class MicroServiceFactory extends ControllerFactory {
  post = micro_method;
  patch = micro_method;
  get = micro_method;
  put = micro_method;
  delete = micro_method;
  url: String;
  /**
   * Default Timeout: 3s
   */
  timeout: Number = parseInt(process.env.MICRO_TIMEOUT as string, 10);
}
