var AWS = require('aws-sdk');
var s3 = new AWS.S3({ apiVersion: '2008-10-17' });
var sha1 = require('sha1');

var ValidationErrorInvalidFile = {
  statusCode: 415,
  body: JSON.stringify({
    message: 'Tipo de archivo no valido'
  }),
  isBase64Encoded: false
};

var InternalServerError = {
  statusCode: 503,
  body: JSON.stringify({
    message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
  }),
  isBase64Encoded: false
};

let getFile = function(fileMime, buffer) {
  let fileExt = fileMime;
  let hash = sha1(Buffer.from(Date().toString()));
  let now = Date.now();

  let filePath = hash + '/';
  let fileName = now + '.' + fileExt;
  let fileFullName = filePath + fileName;
  let fileFullPath = 'https://salgode-bucket.s3.amazonaws.com/' + fileFullName;

  let params = {
    Key: fileFullName,
    Bucket: 'salgode-bucket',
    Body: buffer
  };

  let uploadFile = {
    size: buffer.toString('ascii').length,
    type: 'image/' + fileExt,
    name: fileName,
    full_path: fileFullPath
  };

  return {
    params: params,
    uploadFile: uploadFile
  };
};

module.exports.handler = function(event, context, callback) {
  let request = JSON.parse(event.body).base64string;
  const customArgs = request.split(',')[0].split(';')[0] || [];
  const extension = customArgs.split('/')[1];
  let base64string = request.split(',')[1];
  let buffer = Buffer.from(base64string, 'base64');
  let fileMime = extension;

  if (fileMime === null) {
    return callback(null, ValidationErrorInvalidFile);
  }

  let file = getFile(fileMime, buffer);
  let params = file.params;
  return s3.upload(params, async (err, data) => {
    if (err) {
      callback(err, InternalServerError);
    } else {
      let response = {
        statusCode: 200,
        headers: {},
        body: JSON.stringify(file.uploadFile),
        isBase64Encoded: false
      };
      callback(null, response);
    }
  });
};
