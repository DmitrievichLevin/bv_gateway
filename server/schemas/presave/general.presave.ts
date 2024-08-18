import { Document, model, Schema } from 'mongoose';
import { ModelValidationError, PreSaveLinkFunction } from './presavechain';
import { FunctionDecorator } from '../general';
import { Model } from '../schemaTypes';
import _ from 'lodash';
import { HTTPError } from '../../error/errorTypes';
const debug = require('debug')('general');

/**
 * Field key shared between parent and subdocument
 */
type Relation = string;

/**
 * Create Default Subdocument on Parent Creation
 * @params collection: string, schema: Schema, relations: Relation[]
 *  Note: will only run if document flagged as new: true
 * @returns {PreSaveLinkFunction}
 */
export function CreateSubDocument(
  collection: string,
  schema: Schema,
  relations: Relation[] = []
): FunctionDecorator {
  const CreateFunc: PreSaveLinkFunction = async ({ self }) => {
    if (self?.new) {
      // Create Default Subdocument on User
      const defaultModel = model(collection, schema);

      const subdocumentRelations = relations.reduce((dict, key) => {
        dict[key] = self?.[key];
        return dict;
      }, {});

      // @ts-ignore
      const defaultObj = defaultModel(subdocumentRelations);
      debug(`${collection} subdocument ${self[collection]}`);
      const err = defaultObj.validateSync();

      if (err) {
        debug(`${collection} subdocument err ${err}`);
        throw new ModelValidationError(
          collection,
          `${err.message} @ ${self.collection.collectionName}.${collection}`
        );
      }

      self[collection] = defaultObj;
    }
  };

  return CreateFunc;
}

export type DependentDocument = {
  properties: { [key: string]: any };
  path: string;
  model: typeof Model;
};

export const InterDependentDocumentCreation = async (
  parent: Document,
  deps: DependentDocument[]
) => {
  const validCheck = (doc) => {
    return doc.validateSync();
  };
  // Cleanup: On Error Attempt to delete all created documents.
  var rollbacks: Function[] = [];

  // Cleanup: Function
  const rollback = async () =>
    Promise.all(rollbacks.map((roll) => roll())).catch((errr) => {
      debug('error deleting rollback', errr);
    });

  // Create Array of Document Save Promises
  const doc_instance_promises = deps.map(
    ({ properties, model: depModel, path }) => {
      // create instance
      let createdDoc = new depModel({ ...properties, parent: parent.id });

      // validate
      let err = validCheck(createdDoc);

      // Throw Validation error
      if (err) {
        rollback();
        debug('SubDoc Validation Error: roll-back');
        throw new HTTPError(
          // @ts-ignore
          `Error creating ${parent.constructor.modelName} dependency ${depModel.modelName}: ${err}`,
          400
        );
      }

      // Push func incase of rollback
      rollbacks.push(() => depModel.findOneAndDelete({ _id: createdDoc._id }));

      return createdDoc.save();
    }
  );

  const res = await Promise.all(doc_instance_promises)
    .then((cre_docs) => {
      cre_docs.forEach((__doc, idx) => {
        _.set(parent, deps[idx].path, __doc.id);
      });

      return parent.save();
    })
    .then((p_s) => {
      const injected_parent = p_s.toObject();
      return injected_parent;
    })
    .catch(async (err) => {
      // Rollback
      await rollback();
      debug('rolling back user creation');
      throw new HTTPError(err.message, 400);
    });

  return res;
};

export const FindRelations = (
  models: (typeof Model)[],
  query: { [key: string]: string }
): Promise<Document[]> =>
  new Promise(async (resolve, reject) => {
    Promise.all(models.map((m) => m.findOne()))
      .then((data) => {
        resolve(data);
      })
      .catch((e) => reject(e));
  });
