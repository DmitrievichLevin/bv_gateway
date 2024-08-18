import { MinutesField } from './fields';
import { MongoSchema } from './schemaTypes';
import { DiscountCodeRegEx } from './validation/regex';

export const DiscountCode = new MongoSchema({
  code: {
    type: String,
    match: DiscountCodeRegEx,
    required: true,
  },
  amount: { type: Number, min: 0, required: true },
  duration: { ...MinutesField, required: true },
  expireAt: {
    type: Date,
    default: function () {
      // Convert minutes to ms
      let ms = this.duration * 60 * 1000;
      return Date.now() + ms;
    },
  },
});
