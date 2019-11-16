const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const dynamoDB = new aws.DynamoDB.DocumentClient();

const s3 = new aws.S3({
  apiVersion: '2008-10-17',
  accessKeyId: process.env.access_key_id,
  secretAccessKey: process.env.access_key_secret
});
const S3_BUCKET = process.env.s3_bucket;

async function getSignedUrl(s3Params) {
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

async function getImageId(folderName, fileName) {
  const imageId = `img_${uuidv4()}`;
  const createAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: process.env.dynamodb_table_name,
    Item: {
      image_id: imageId,
      folder_name: folderName,
      file_name: fileName,
      created_at: createAt
    }
  };
  try {
    await dynamoDB.put(params).promise();
    return imageId;
  } catch (e) {
    return e;
  }
}

async function getImageIdStaging(folderName, fileName) {
  const imageId = `img_${uuidv4()}`;
  const createAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: `Dev_${process.env.dynamodb_table_name}`,
    Item: {
      image_id: imageId,
      folder_name: folderName,
      file_name: fileName,
      created_at: createAt
    }
  };
  try {
    await dynamoDB.put(params).promise();
    return imageId;
  } catch (e) {
    return e;
  }
}

exports.handler = async (event, context) => {
  const fileName = uuidv4() + event.file_name;
  const fileType = event.file_type;
  const folderName = uuidv4();

  const s3Params = {
    Bucket: `${S3_BUCKET}/${folderName}`,
    Key: fileName,
    Expires: 1000,
    ContentType: fileType,
    ACL: 'public-read'
  };

  const result = {
    success: true,
    image_id: context.invokedFunctionArn && context.invokedFunctionArn.includes('staging')
      ? await getImageIdStaging(folderName, fileName)
      : await getImageId(folderName, fileName),
    image_urls: {
      upload: await getSignedUrl(s3Params, folderName, fileName),
      fetch: `https://static.salgode.com/${folderName}/${fileName}`
    }
  };

  return result;
};
