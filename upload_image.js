const AWS = require('aws-sdk');

const s3 = new AWS.S3({ apiVersion: '2008-10-17' });
const sha1 = require('sha1');

const ValidationErrorInvalidFile = {
  statusCode: 415,
  body: JSON.stringify({
    message: 'Tipo de archivo no valido'
  }),
  isBase64Encoded: false
};

const InternalServerError = {
  statusCode: 503,
  body: JSON.stringify({
    message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
  }),
  isBase64Encoded: false
};

const getFile = function getFile(fileMime, buffer) {
  const fileExt = fileMime;
  const hash = sha1(Buffer.from(Date().toString()));
  const now = Date.now();

  const filePath = `${hash}/`;
  const fileName = `${now}.${fileExt}`;
  const fileFullName = filePath + fileName;
  const fileFullPath = `https://salgode-bucket.s3.amazonaws.com/${fileFullName}`;

  const params = {
    Key: fileFullName,
    Bucket: 'salgode-bucket',
    Body: buffer
  };

  const uploadFile = {
    size: buffer.toString('ascii').length,
    type: `image/${fileExt}`,
    name: fileName,
    full_path: fileFullPath
  };

  return {
    params,
    uploadFile
  };
};

module.exports.handler = function (event, context, callback) {
  const request = JSON.parse(event.body).base64string;
  const customArgs = request.split(',')[0].split(';')[0] || [];
  const extension = customArgs.split('/')[1];
  const base64string = request.split(',')[1];
  const buffer = Buffer.from(base64string, 'base64');
  const fileMime = extension;

  if (fileMime === null) {
    return callback(null, ValidationErrorInvalidFile);
  }

  const file = getFile(fileMime, buffer);
  const { params } = file;
  return s3.upload(params, async (err) => {
    if (err) {
      callback(err, InternalServerError);
    } else {
      const response = {
        statusCode: 200,
        headers: {},
        body: JSON.stringify(file.uploadFile),
        isBase64Encoded: false
      };
      callback(null, response);
    }
  });
};
