import mongoose, { model, Types } from 'mongoose';

const debug = require('debug')('validation-chain');

export class ModelValidationError extends Error {
  constructor(field: string, message: string) {
    super(message);
    this.__field = field;
  }

  __field: string;
}

/**
 * Validator Link
 * @params { colletionName: string; self: typeof Model; query: string; }
 * @throws ModelValidationError Important: Must manually validate.
 * @summary ValidationChain will invalidate when throwing ModelValidationError
 * @returns void
 */
export type PreSaveLinkFunction = (props: {
  collection: string;
  query?: { [key: string]: any };
  self: { [key: string]: any };
  opts: { [key: string]: any };
}) => void;

/**
 * Object containing Validator link
 * @summary Wrap Validator functions like so when passing to Validation chain.
 *
 */
export type PreSaveLink = {
  collection?: string;
  query?: string[];
  func: PreSaveLinkFunction;
};

/**
 *
 * @param validators
 * @returns - Schema Presave Function
 */
export const PresaveChain = (validators: PreSaveLink[]) => {
  async function chain(next, opts) {
    const self = this;

    for (var i = 0; i < validators.length; i += 1) {
      const {
        func,
        query = [],
        // Defaults to current model collection
        collection = this.collection.collectionName,
      } = validators[i];

      const queryObj = query.reduce((dict, item) => {
        dict[item] = self[item];
        return dict;
      }, {});

      await func({ collection, query: queryObj, self, opts });
    }
    next();
  }

  return chain;
};

export const uniqueValidator: PreSaveLinkFunction = async function ({
  collection,
  query,
  self,
}) {
  try {
    const model = mongoose.model(collection, self.schema);
    const found = await model.findOne(query);

    if (found) {
      throw new ModelValidationError('user', 'Existing record found');
    }
  } catch (err) {
    throw new ModelValidationError(collection, err.message);
  }
  return self;
};

/**
 * Clean Document during Pre-Save
 * @summary - Non Strict Schemas, remove properties not on schema during validation (used after pre-save subdocument creation)
 *
 */
export const CleanDocument = async ({ self }) => {
  Object.keys(self._doc).forEach((key) => {
    if (!self.schema.paths?.[key]) {
      delete self._doc[key];
    }
  });
};
