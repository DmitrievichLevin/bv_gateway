import {
  BoolDef,
  EmailField,
  IdField,
  LocationField,
  MinutesField,
  PhoneField,
  StatusCode3,
  StatusCode4,
  StreetAddressField,
  StringReq,
  USDField,
} from './fields';
import { BevorSchema, defaultSchemaOptions } from './general';

const CustomerSchema = BevorSchema({
  firstName: StringReq,
  lastName: StringReq,
  isNewCustomer: BoolDef,
  email: EmailField,
  phone: PhoneField,
  id: IdField,
  autoMessage: BoolDef,
  location: LocationField,
  address: StreetAddressField,
});

export const AppointmentSchema = BevorSchema({
  id: IdField,
  vendorId: IdField,
  serviceId: IdField,
  customer: IdField,
  repeat: { type: Number, default: 0 },
  additionalNote: { type: String },
  isAutoAccept: { type: Boolean, default: false },

  /**
   * Created, Checked-In, Checked-Out
   */
  status: StatusCode3,
  /**
   * Upcoming, Started, Finished, Cancelled
   */
  appointmentStatus: StatusCode4,

  // Time
  checkInTime: MinutesField,
  checkOutTime: MinutesField,
  date: { type: String, required: true },
  startTime: { type: Number, require: true },
  endDate: { type: String, required: true },
  endTime: { type: Number, require: true },
  // Time

  // Payment
  /**
   * unPaid, Paid Deposit, Paid
   */
  isPaid: StatusCode3,
  paidAmount: USDField,
  totalAmount: USDField,
  discountCodeId: IdField,
  addOns: [IdField],
  // Payment

  // Cancellation
  noShow: { type: Boolean, default: false },
  cancelReason: { type: String },
});
