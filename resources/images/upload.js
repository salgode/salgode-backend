var AWS = require('aws-sdk');
var s3 = new AWS.S3({ apiVersion: '2008-10-17' });
var fileType = require('file-type');
var {
  ValidationErrorInvalidFile,
  InternalServerError
} = require('../../constants/validationResponses');
var sha1 = require('sha1');

let getFile = function(fileMime, buffer) {
  let fileExt = fileMime.ext;
  let hash = sha1(new Buffer(new Date().toString()));
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
    type: fileMime.mime,
    name: fileName,
    full_path: fileFullPath
  };

  console.log('uploadFile', uploadFile);
  return {
    params: params,
    uploadFile: uploadFile
  };
};

module.exports = async function(event, callback) {
  let request = event;
  let base64string = request;
  let buffer = Buffer.from(base64string, 'base64');
  let fileMime = await fileType(buffer);
  console.log(fileMime);

  if (fileMime === null) {
    return callback(null, ValidationErrorInvalideFile);
  }

  let file = getFile(fileMime, buffer);
  let params = file.params;

  s3.upload(params, function(err, data) {
    if (err) {
      console.error(err);
      return callback(null, InternalServerError);
    }
    const response = {
      statusCode: 200,
      data: file.uploadFile
    };
    return callback(null, response);
  });
};
