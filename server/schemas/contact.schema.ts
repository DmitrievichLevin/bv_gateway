import { IdField } from './fields';
import { defaultSchemaOptions } from './general';
import { MongoSchema } from './schemaTypes';
import { PhoneRegex } from './validation/regex';

export const ContactSchema = new MongoSchema(
  {
    fname: { type: String, require: true },
    lname: { type: String, require: true },
    phone: { type: String, match: PhoneRegex, required: true },
    email: { type: String, required: true, unique: true, index: true },
  },
  defaultSchemaOptions
);
