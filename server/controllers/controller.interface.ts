import { Operations } from '../routes/route.interface';
import { Model } from '../schemas/schemaTypes';
import t from 'ts-runtime/lib';
import { Redis } from 'ioredis';
import { ResourceCache } from '../connections/redis/cache.interface';
import { UserDocument } from '../models/helpers/types';

/**
 * @todo delete function should verify bearerToken
 * ensures that user owns the resource being deleted.
 */
const debug = require('debug')('controller-interface');

export type ControllerArgs = [
  typeof Model,
  Express.Application,
  Redis,
  WebSocket
];

export type AuthenticatedRequest = Request & {
  authenticated_user: UserDocument;
};

export type EnabledHTTP = (
  req: AuthenticatedRequest,
  res: Response
) => Promise<Object | null>;

export type DisabledHTTP = (
  req: AuthenticatedRequest,
  res: Response
) => Promise<void>;

async function getByID(req, _) {
  const { id } = req.body;

  const data = await this.model.findOne({ id }, {});

  return data;
}

const DisabledMethod: DisabledHTTP = async (_req, res) => {
  throw new Error('405 Method Not Allowed', { cause: 405 });
};

/**
 *
 * Concrete Controller Base Class
 * @class
 * @example
 * class TestControllerFactory extends ControllerFactory {
 *    get = async (req, res) => {
 *        return 'Hello World'
 *      };
 *  }
 */
class ControllerFactory {
  constructor(...args: ControllerArgs) {
    const [model, app, redis, rpc] = args;
    this.model = model;
    this.app = app;
    this.redis = redis;
    this.rpc = rpc;
  }

  build = () => {
    Object.getOwnPropertyNames(this).forEach((name) => {
      if (name in Operations) {
        this[name] = this[name].bind(this);
      }
    });
    return this;
  };

  model: typeof Model;

  app: Express.Application;

  redis: Redis;

  post: EnabledHTTP | DisabledHTTP = DisabledMethod;

  patch: EnabledHTTP | DisabledHTTP = DisabledMethod;

  get: EnabledHTTP | DisabledHTTP = DisabledMethod;

  getById: EnabledHTTP | DisabledHTTP = DisabledMethod;

  put: EnabledHTTP | DisabledHTTP = DisabledMethod;

  delete: EnabledHTTP | DisabledHTTP = DisabledMethod;

  middlewares: any[] = [];

  cache: ResourceCache = CacheBypass;

  rpc: WebSocket;
}

export const CacheBypass = {
  __get: async (params) => null,
  __set: async (params) => [null, params],
} as ResourceCache;

export { ControllerFactory, getByID, DisabledMethod };
