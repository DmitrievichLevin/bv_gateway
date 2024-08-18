import { uuidValidator } from './validation/fieldValidators';
import {
  Address1Regex,
  Address2Regex,
  LocationRegEx,
  PhoneRegex,
  TagRegex,
  v4Regex,
} from './validation/regex';

export const PhoneField = { type: String, match: PhoneRegex, required: true };

/**
 * @field [City], [State] [Zip]
 */
export const LocationField = {
  type: String,
  match: LocationRegEx,
  required: true,
};

export const EmailField = {
  type: String,
  required: true,
  unique: true,
  index: true,
};

export const UltimatumField = {
  true: { type: Boolean, default: true },
  false: { type: Boolean, default: true },
};

export const IdField = { type: String, required: true };

export const MinutesField = { type: Number, min: 0, max: 1440, default: 0 };

export const TagField = {
  type: [String],
  validate: {
    validator: function (value) {
      return value.every((tag) => TagRegex.test(tag));
    },
    message:
      'Tags can only contain alphanumeric chars, between 3 & 10 characters in length.',
  },
};

export const WeekDaysField = {
  type: Array,
  default: [
    {
      active: false,
      hours: {
        start: 540,
        end: 1020,
      },
    },
    {
      active: true,
      hours: {
        start: 540,
        end: 1020,
      },
    },
    {
      active: true,
      hours: {
        start: 540,
        end: 1020,
      },
    },
    {
      active: true,
      hours: {
        start: 540,
        end: 1020,
      },
    },
    {
      active: true,
      hours: {
        start: 540,
        end: 1020,
      },
    },
    {
      active: true,
      hours: {
        start: 540,
        end: 1020,
      },
    },
    {
      active: false,
      hours: {
        start: 540,
        end: 1020,
      },
    },
  ],
};

export const StreetAddressField = {
  address1: {
    type: String,
    match: Address1Regex,
    default: '',
  },
  address2: {
    type: String,
    match: Address2Regex,
    default: '',
  },
};

export const USDField = { type: Number, min: 0, default: 0 };

export const StatusCode3 = { type: Number, min: 0, max: 2, default: 0 };
export const StatusCode4 = { type: Number, min: 0, max: 3, default: 0 };

export const StringReq = { type: String, require: true };
export const BoolDef = { type: Boolean, default: true };

export const MediaField = { type: String, match: v4Regex, default: null };

export const AddonsField = {
  type: [String],
  validate: {
    validator: uuidValidator,
    message: 'All addon references must be uuid(s).',
  },
};

export const MultiMediaField = {
  type: [String],
  validate: {
    validator: uuidValidator,
    message: 'All media references must be uuid(s).',
  },
};
