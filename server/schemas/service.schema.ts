import { MongoSchema } from './schemaTypes';
import { DiscountCode } from './discount.schema';
import {
  AddonsField,
  IdField,
  MinutesField,
  MultiMediaField,
  TagField,
} from './fields';
import { BevorSchema } from './general';

export const ServiceSchema = BevorSchema({
  parent: IdField,
  name: { type: String, minLength: 3, maxLength: 60, required: true },
  price: { type: Number, min: 1, required: true },
  active: { type: Boolean, default: true },
  /**
   * Primary-Image = images[0]
   */
  images: MultiMediaField,
  deposit: { type: Number, min: 0, default: 0 },
  description: { type: String, default: '' },
  included: AddonsField,
  duration: { ...MinutesField, required: true },
  tags: TagField,
  discounts: [DiscountCode],
});
