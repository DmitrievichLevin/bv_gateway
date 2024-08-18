const { Schema: Schema, Types, model: Model } = require('mongoose');

const { ObjectId, Buffer, Mixed, Decimal128, Map, UUID, BigInt } = Types;

export {
  ObjectId,
  Buffer,
  Decimal128,
  Map,
  Mixed,
  Schema as MongoSchema,
  UUID,
  BigInt,
  Model,
};
