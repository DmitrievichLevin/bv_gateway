import { IdField, UltimatumField } from './fields';
import { MongoSchema } from './schemaTypes';

const SettingsSchema = new MongoSchema({
  parent: IdField,
  vendorId: IdField,
  hideAddress: UltimatumField.false,
  hidePhone: UltimatumField.false,
  autoAccept: UltimatumField.true,
  autoSMS: UltimatumField.true,
  allow: {
    reschedule: UltimatumField.false,
    overbooking: UltimatumField.true,
    tips: UltimatumField.true,
  },
});

export { SettingsSchema };
