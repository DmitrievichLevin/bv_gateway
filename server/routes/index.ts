class UnixAbsolutePath {
  /**
   * Unix Absolute Path
   * Can be a path to a directory or a path to a file.
   *
   * Examples: /bin/bash, /var/log/
   */
  private path: string;

  constructor(path: string) {
    this.path = this.validated(path);
  }

  public getPath(): string {
    return this.path;
  }

  public setPath(path: string): void {
    this.path = this.validated(path);
  }

  // eslint-disable-next-line class-methods-use-this
  private validated(path: string): string {
    const regex = new RegExp('^(/[^/ ]*)+/?$');

    if (!regex.test(path)) {
      throw new TypeError(`${path} is not a valid unix filesystem path.`);
    }

    return path;
  }
}

type Router = {
  post(route: UnixAbsolutePath, method: Function): void;
  get(route: UnixAbsolutePath, method: Function): void;
  put(route: UnixAbsolutePath, method: Function): void;
  delete(route: UnixAbsolutePath, method: Function): void;
};

export { Router, UnixAbsolutePath };
