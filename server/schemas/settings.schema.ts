import { IdField, UltimatumField } from './fields';
import { MongoSchema } from './schemaTypes';

const SettingsSchema = new MongoSchema({
  parent: IdField,
  hideAddress: UltimatumField.false,
  hidePhone: UltimatumField.false,
  autoAccept: UltimatumField.true,
  autoSMS: UltimatumField.true,
  allow: {
    reschedule: UltimatumField.false,
    tips: UltimatumField.true,
  },
});

export { SettingsSchema };
