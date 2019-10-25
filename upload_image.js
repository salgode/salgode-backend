const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const s3 = new aws.S3({
  apiVersion: '2008-10-17',
  accessKeyId: process.env.access_key_id,
  secretAccessKey: process.env.access_key_secret
});
const S3_BUCKET = process.env.s3_bucket;

async function getSignedUrl(s3Params, folderName, fileName) {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', s3Params, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

//todo get image id
async function getImageId(folderName, fileName) {
  return 'img_12345';
}

exports.handler = async (event) => {
  const fileName = uuidv4() + event.file_name;
  const fileType = event.file_type;
  const folderName = uuidv4();

  const s3Params = {
    Bucket: `${S3_BUCKET}/${folder}`,
    Key: fileName,
    Expires: 1000,
    ContentType: fileType,
    ACL: 'public-read'
  };

  const result = {
    success: true,
    image_id: await getImageId(folderName, fileName),
    image_urls: {
      upload: await getSignedUrl(s3Params, folderName, fileName),
      fetch: 'https://static.salgode.com/'+folderName+'/'+fileName
    }
  };

  return result;
};
