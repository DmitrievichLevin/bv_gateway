/**
 * Error Handler Response
 * @property {string} message - Error message.
 * @property {boolean} authError - Flag for failed authentication.
 */
export type ErrorResponse = {
  message: string;
  authError: boolean;
};

export class HTTPError extends Error {
  constructor(message, htmlCode: number = 500) {
    super(message);
    this.htmlCode = htmlCode;
  }

  htmlCode: number = 500;
  authError: boolean;
}
