import { Schema } from 'mongoose';
import {
  ControllerFactory,
  DisabledMethod,
  ControllerArgs,
  CacheBypass,
} from '../controllers/controller.interface';
import { Router } from '.';
import { Model } from '../schemas/schemaTypes';
import { validationResult } from 'express-validator';
import { FunctionDecorator } from '../schemas/general';
import { Redis, Result } from 'ioredis';
import { CACHE_DURATION } from '../constants';
import { SetResponse } from '../connections/redis/cache.interface';

const debug = require('debug')('Model Interface');

const extractMethod = (factory, name) => {
  return {
    func: factory?.[name] ?? DisabledMethod,
    middleware: factory.middlewares,
  };
};

const isGetReq = (key: string) => {
  return key === 'GET';
};

type RouterOperation = {
  key: 'get' | 'post' | 'put' | 'delete' | 'patch';
  subdir: string[];
};
const Operations: { [key: string]: RouterOperation } = {
  ...['get', 'post', 'put', 'delete', 'patch'].reduce((obj, v) => {
    obj[v] = { key: v };
    return obj;
  }, {}),
  getById: {
    key: 'get',
    subdir: ['/id'],
  },
};

function CachedResponse(res, cache) {
  const Decorated = (data): Promise<SetResponse> => {
    debug('sending cache response');
    res.status(200).send({ data });
    return cache.__set(data);
  };
  return Decorated;
}

function ControllerResponse(req, res, controllerMethod, collection) {
  const Decorated = async (): Promise<SetResponse> => {
    let contResult;

    try {
      contResult = await controllerMethod(req, res);
      debug('check headers sent in decorator', res.headersSent);
      /**
       * Check for sent headers
       * case: multipart file upload
       */
      if (res.headersSent) return [null, null];
    } catch (e) {
      /**
       * Check for sent headers
       * case: multipart file upload error during stream.
       */
      if (!res.headersSent)
        res.status(e?.htmlCode || 500).send({ message: e.message });
      return [null, null];
    }

    if (contResult) {
      res.status(200).send({ data: contResult });
    } else if (contResult === null) {
      // No Content Response
      res.status(204).send();
    } else {
      const NotFound = {
        message: `${collection} Resource not-found: 404`,
      };
      return [NotFound as Error, null];
    }
    return [null, contResult];
  };
  return Decorated;
}

class RouteFactory {
  constructor(app: Express.Application, redis: Redis) {
    this.app = app;
    this.redis = redis;

    /**
     * @todo - Knot Test
     */
    this.rpc = new WebSocket('ws://localhost:9021?id=server');
  }
  build(router: Router) {
    try {
      // Set Collection Name
      this.collection = this.collection ?? this.constructor.name.toLowerCase();

      // Initialize Model
      if (this.schema) {
        this.model = Model(this.collection, this.schema);
      }

      // Set Route Path
      this.path = this.path ?? `/${this.collection}`;

      // Controller Params
      let controllerArgs: ControllerArgs = [
        this.model,
        this.app,
        this.redis,
        this.rpc,
      ];

      // Initialize and Bind child methods
      const factory = new this.controller(...controllerArgs).build();

      /**
       * Extract http methods from factory.
       */
      Object.entries(Operations).forEach(
        ([method, { key, subdir = [] }]: [string, any]) => {
          var { func, middleware } = extractMethod(factory, method);

          var pathDir = this.path + subdir.join();

          if (func) {
            const HTTPMethodDecorator: FunctionDecorator = async (req, res) => {
              const errResponse = (err) => {
                debug('err response', err);
                res.status(err?.cause ?? 500).send({ message: err.message });
              };

              try {
                validationResult(req).throw();
              } catch (e) {
                errResponse(e);
                return;
              }

              // Use cache on HTTP: GET or Bypass
              const cache = isGetReq(key) ? factory.cache : CacheBypass;

              cache
                .__get(req.params)
                // If data is cached break promise
                // Else return queryFunc
                .then(
                  (data) =>
                    new Promise((resolve, reject) => {
                      if (data) {
                        debug('rejecting', data);
                        // Found Data Exiting Chain w/ response
                        reject(data);
                      } else {
                        resolve(null);
                      }
                    })
                )
                .then(
                  // Not Cached
                  ControllerResponse(req, res, func, this.collection),
                  // Cache Found
                  CachedResponse(res, cache)
                )
                .then(([err, _]) => {
                  if (err) {
                    debug(`Error: ${this.collection} -> cache.__set \n${err}`);
                    res.status(404).send({ message: err.message });
                  }
                })
                // Catch rest...
                .catch(errResponse);
            };

            if (func.name !== 'bound DisabledMethod') {
              router[key](pathDir, middleware, HTTPMethodDecorator);
            }
          }
        }
      );
    } catch (err) {
      debug(`Error building route ${this.path}: ${err}`);
    }
  }

  controller: typeof ControllerFactory = ControllerFactory;

  path: string;

  collection: string;

  schema?: typeof Schema;

  model: typeof Model;

  app: Express.Application;

  redis: Redis;

  rpc: WebSocket;
}

export { RouteFactory, Operations };
