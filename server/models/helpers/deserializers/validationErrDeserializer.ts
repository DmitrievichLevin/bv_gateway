import { SyncValidationError } from '../types';

export const FormatSyncValidationError = (
  name: string,
  err: SyncValidationError
) => {
  const errors = Object.entries(err.errors)?.reduce(
    (msgs: string[], [key, { message }]) => {
      msgs.push(`${name}.${key} ${message}`);
      return msgs;
    },
    []
  );

  return errors[0];
};
