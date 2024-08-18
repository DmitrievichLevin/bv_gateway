const createDebug = require('debug');
createDebug.color = 'purple';

const debug = createDebug('Fallback: Error-Handler');

export default (err, req, res, next) => {
  debug(`Error Handler Fallback %o`, err);
  res
    .status(500)
    .send({ message: err.message, authError: err?.authError || false });
};
