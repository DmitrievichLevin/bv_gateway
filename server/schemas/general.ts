import dayjs from 'dayjs';
import { MongoSchema } from './schemaTypes';
const debug = require('debug')('bevor-schema');
const formatDocumentObj = (obj) => {
  obj['id'] = obj._id.toString();
  let created_at = dayjs(obj.created_at).unix();
  let updated_at = dayjs(obj.updatedAt).unix();
  let parent = obj?.parent || null;

  if (parent) delete obj.parent;
  delete obj.created_at;
  delete obj.updatedAt;
  delete obj.__v;
  delete obj._id;

  obj['metadata'] = { created_at, updated_at, parent };
};

// schema options
export const defaultSchemaOptions = {
  // bufferTimeoutMS: 1000,
  timestamps: { createdAt: 'created_at' },
  toJSON: {
    transform: function (doc, obj) {
      formatDocumentObj(obj);
      return obj;
    },
  },
  toObject: {
    transform: function (doc, ret, game) {
      formatDocumentObj(ret);
    },
  },
};

type FunctionDecorator = (...args: any[]) => Function | void | Promise<any>;

export const BevorSchema = (fields) =>
  new MongoSchema(fields, defaultSchemaOptions);

export { FunctionDecorator };
