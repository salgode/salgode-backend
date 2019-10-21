var aws = require('aws-sdk');

function encrypt(buffer) {
  const kms = new aws.KMS();
  return new Promise((resolve, reject) => {
    const params = {
      KeyId: process.env.SalgodeEncrypt, // CMK ID
      Plaintext: buffer // The data to encrypt.
    };
    kms.encrypt(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.CiphertextBlob.toString('base64'));
      }
    });
  });
}

function decrypt(buffer) {
  const kms = new aws.KMS();
  return new Promise((resolve, reject) => {
    const params = {
      CiphertextBlob: buffer // The data to dencrypt.
    };
    kms.decrypt(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Plaintext);
      }
    });
  });
}

module.exports = { encrypt, decrypt };
