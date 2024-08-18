import { objectPathRegex } from '../../schemas/validation/regex';
const debug = require('debug')('controller-helper-mutations');

export const mutateObject = (
  obj: { [key: string]: any },
  data: any,
  path: string
) => {
  const validate = new RegExp(objectPathRegex);
  if (validate.test(path)) {
    const pathTo = path.split('.');
    var pointer = obj;
    pathTo.forEach((p, idx) => {
      if (idx === pathTo.length - 1) {
        pointer[p] = data;
      } else {
        pointer = pointer[p];
      }
    });
  } else {
    throw new Error(
      `Invalid path to property ${path}, expected '.' delimited string starting with alpha chars, and ending with either alpha or numeric, but not both.`
    );
  }
};
