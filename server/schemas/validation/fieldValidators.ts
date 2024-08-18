import { v4Regex } from './regex';

export function uuidValidator(value) {
  return value.every((id) => v4Regex.test(id));
}
