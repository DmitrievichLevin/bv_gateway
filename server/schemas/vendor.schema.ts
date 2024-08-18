import {
  IdField,
  LocationField,
  MediaField,
  PhoneField,
  StreetAddressField,
  WeekDaysField,
} from './fields';
import { BevorSchema } from './general';

export const VendorSchema = BevorSchema({
  parent: IdField,
  name: { type: String, minLength: 3, maxLength: 40, required: true },
  contact: {
    phone: PhoneField,
    instagram: { type: String, required: false, default: null },
    facebook: { type: String, required: false, default: null },
    tiktok: { type: String, required: false, default: null },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  image: MediaField,
  open: WeekDaysField,
  address: StreetAddressField,
  location: LocationField,
});
