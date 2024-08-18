const DiscountCodeRegEx = /^#(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,15}/;
const LocationRegEx = /^([A-Za-z\. ]+),[ ]?([A-Za-z]{2})$/gi;
const Address1Regex = /^(\d{2,}) ([A-Za-z]{2,})(( (st|rd|ave|dr))?)$/gi;
const Address2Regex = /^(((suite|unit|apt)\s)?)(#?[A-Za-z\d]+)$/gi;
const PhoneRegex = /^[\d]{10}$/;
const TagRegex = /^([a-z0-9]{3,10})$/gi;
const v4Regex =
  /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/gi;
const NumRegex = /^([0-9]+)$/g;

// File Naming Convention [collectionName].[route|schema|controller].ts
const FileNomenclature = /^([A-za-z]{2,})\.(route|schema|controller)\.(ts)$/gi;
const RouteFileNomenclature = /^([A-za-z]{2,})\.(route)\.(ts)$/gi;

const objectPathRegex = /^([a-z]+)((\.[a-z]+)|(\.[0-9]+))*$/gi;

const streamContentRegex = /^(progress|message|data|error){1}$/g;

export {
  DiscountCodeRegEx,
  LocationRegEx,
  Address1Regex,
  Address2Regex,
  PhoneRegex,
  FileNomenclature,
  RouteFileNomenclature,
  objectPathRegex,
  TagRegex,
  v4Regex,
  NumRegex,
  streamContentRegex,
};
