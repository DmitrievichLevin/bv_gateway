const multipart = require('parse-multipart-data');
const deb = require('debug')('controllers/middleware:ParseRawMultipart');

const initialRequestBodyProps = {
  fileSum: 0,
  __media: {
    image: false,
    video: false,
    file: false,
    images: 0,
    videos: 0,
    files: 0,
  },
};
/**
 * Raw Multipart Parser
 * @summary - Parse !File data in multipart/form-data
 * @param req
 * @param res
 * @param next
 * @returns {raw: Buffer<req.body>, ...(non-file data)} = req.body
 */
export const ParseRawMultipart = async (req, res, next) => {
  req.body = { ...req.body, ...initialRequestBodyProps };
  try {
    let boundary = req.headers['content-type'];
    deb('content-type ', boundary);
    if (boundary.includes('multipart/form-data')) {
      boundary = boundary.replace('multipart/form-data; boundary=', '').trim();
      let parts = multipart.parse(req.body, boundary);
      deb('check parts', parts);
      parts = parts.reduce((dct, { filename = null, name, data }) => {
        if (!filename) {
          dct[name] = data.toString();
        } else {
          // Check singletons
          if (/^(image|file|video)$/.test(name)) {
            dct.__media[name] = true;
            dct.fileSum += 1;
            // Test file arr(s)
          } else if (/^(image|file|video)s\d$/.test(name)) {
            // Count images,files,videos
            var k = name.replace(/\d/g, '');
            dct.__media[k] += 1;
            dct.fileSum += 1;
          } else {
            // Invalid key
            throw new Error(
              `Invalid Form key, Expected image(s), file(s), or video(s), but found ${name}`
            );
          }
        }
        return dct;
      }, initialRequestBodyProps);

      req.body = { raw: req.body, ...parts };
    } else {
      deb('skip parsing');
    }
    next();
  } catch (e) {
    next(e);
  }
};
