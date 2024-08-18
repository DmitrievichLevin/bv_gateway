import express from 'express';
import fs from 'fs';
import { PathParams, Handler } from 'express-serve-static-core';
import { RouteFileNomenclature } from '../schemas/validation/regex';
import { ignoredRouteFilenames } from '../constants';

/**
 * Connect to redis
 */
const { redis } = require('../connections/redis');

const listEndpoints = require('express-list-endpoints');

const debug = require('debug')('App Builder');

/**
 * @TODO - this was killing nested json parsing in body
 */
const sanitizer = [
  //   body('*').escape(),
  //   query('*').notEmpty().escape(),
];

type MiddleWare = any;

interface AppBuilderInterface {
  path: PathParams;
  expressApp: express.Express;
  router: express.Router;
  bridge: (middleware: MiddleWare | Handler, options?: object) => this;
}

async function resolvePath(
  filePath: string,
  router: express.Router,
  app: express.Application
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const routeRegex = new RegExp(RouteFileNomenclature);
    if (routeRegex.test(filePath) === true) {
      // Import Route from file
      var resolveImport = import(`../routes/${filePath}`)
        .then((RouteModule) => {
          const fileNameSegments = filePath.split('.');
          const routeName = fileNameSegments[0];

          const className =
            routeName.charAt(0).toUpperCase() + routeName.slice(1);
          // Initialize Route
          var RouteFactory = new RouteModule[className](app, redis);

          // Build Routes
          RouteFactory.build(router);

          resolve(true);
        })
        .catch((err) => {
          // Fault Tolerance: Will Skip/Log Models that fail to load.
          let errMessage = `Failed to load Route Factory @ ${filePath} ${err.stack}`;
          debug(errMessage);
          resolve(false);
        });
    } else {
      // Supress logs for ignored route file names
      if (!ignoredRouteFilenames.includes(filePath))
        debug(`Invalid fileName Route Factory @ ${filePath}`);
      resolve(false);
    }
  });
}

class AppBuilder implements AppBuilderInterface {
  constructor() {
    this.expressApp = express();
    this.router = express.Router();
  }

  get app(): express.Express {
    return this.expressApp;
  }

  async build(): Promise<any> {
    /**
     * Dynamically Build Routes
     * @summary:
     * - Route File Name Nomenclature: [collection].route.ts
     */
    debug('Starting Builder');

    const dir = `${process.cwd()}/server/routes`;

    const paths = fs
      .readdirSync(dir, { withFileTypes: true })
      .reduce((list: Promise<boolean>[], item) => {
        if (!item.isDirectory()) {
          // Append to list
          list.push(resolvePath(item.name, this.router, this.app));
        }
        return list;
      }, []);

    // Return Promise to resolve routes
    return Promise.all(paths).then(() => {
      this.app.use(this.path, sanitizer, this.router);
      debug('Available REST Endpoints', listEndpoints(this.app));
      return this.app;
    });
  }

  path = '';

  expressApp: express.Express;

  router: express.Router;

  bridge(middleware: MiddleWare, options?: any): this {
    this.app.use(middleware(options));
    return this;
  }
}

export { AppBuilder, AppBuilderInterface };
