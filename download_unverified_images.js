/* eslint-disable no-param-reassign */
const aws = require('aws-sdk');

const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesVerificationsBaseUrl = process.env.salgode_images_verifications_base_url;
const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

async function getImages(imageIds) {
  const params = {
    RequestItems: {
      [ImagesTableName]: {
        Keys: mapIdKeys(imageIds, 'image_id'),
        ProjectionExpression:
          'image_id, folder_name, file_name',
        ConsistentRead: false
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  const imagesWithUrls = data.Responses[ImagesTableName].map((img) => ({
    image_id: img.image_id,
    url: parseUrl(ImagesBaseUrl, img.folder_name, img.file_name)
  }));
  return imagesWithUrls;
}

async function getUsers() {
  const params = {
    TableName: UsersTableName,
    ProjectionExpression: 'user_id, #ui, #uv',
    FilterExpression:
      '#uv.#si = :f or #uv.#dl.#f = :f or #uv.#dl.#b = :f or #uv.#id.#f = :f or #uv.#id.#b = :f',
    ExpressionAttributeNames: {
      '#ui': 'user_identifications',
      '#uv': 'user_verifications',
      '#si': 'selfie_image_checked',
      '#dl': 'driver_license',
      '#id': 'identification',
      '#f': 'front_checked',
      '#b': 'back_checked'
    },
    ExpressionAttributeValues: { ':f': false }
  };
  const data = await dynamoDB.scan(params).promise();
  return data.Items;
}

function imgUserHash(users) {
  const info = {};
  for (let i = 0; i < users.length; i += 1) {
    if (!users[i].user_verifications.selfie_image_checked) {
      info[users[i].user_identifications.selfie_image] = {
        user_id: users[i].user_id,
        field: 'selfie_image'
      };
    }
    if (!users[i].user_verifications.identification.front_checked) {
      info[users[i].user_identifications.identification.front] = {
        user_id: users[i].user_id,
        field: 'identification-front'
      };
    }
    if (!users[i].user_verifications.identification.back_checked) {
      info[users[i].user_identifications.identification.back] = {
        user_id: users[i].user_id,
        field: 'identification-back'
      };
    }
    if (users[i].user_identifications.driver_license.front
      && !users[i].user_verifications.driver_license.front_checked) {
      info[users[i].user_identifications.driver_license.front] = {
        user_id: users[i].user_id,
        field: 'driver_license-front'
      };
    }
    if (users[i].user_identifications.driver_license.back
      && !users[i].user_verifications.driver_license.back_checked) {
      info[users[i].user_identifications.driver_license.back] = {
        user_id: users[i].user_id,
        field: 'driver_license-back'
      };
    }
  }
  return info;
}

function parseVerificationUrl(baseUrl, imageId, action, userId, field) {
  return `${baseUrl}/${imageId}/${action}?user=${userId}&field=${field}`;
}

function buildImagesReviewCsv(imagesUser, images) {
  const csvLinksHash = imagesUser;
  for (let i = 0; i < images.length; i += 1) {
    csvLinksHash[images[i].image_id].image_url = images[i].url;
    csvLinksHash[images[i].image_id].verify_url = parseVerificationUrl(
      ImagesVerificationsBaseUrl,
      images[i].image_id,
      'verify',
      csvLinksHash[images[i].image_id].user_id,
      csvLinksHash[images[i].image_id].field
    );
    csvLinksHash[images[i].image_id].review_url = parseVerificationUrl(
      ImagesVerificationsBaseUrl,
      images[i].image_id,
      'review',
      csvLinksHash[images[i].image_id].user_id,
      csvLinksHash[images[i].image_id].field
    );
  }
  const csvRows = Object.values(csvLinksHash).map((v) => `"${v.image_url}";"${v.verify_url}";"${v.review_url}"`);
  const imagesReviewCsv = csvRows.reduce((prev, cur) => (`${prev}\n${cur}`));
  return imagesReviewCsv;
}

exports.handler = async () => {
  const users = await getUsers();
  const imagesUser = imgUserHash(users);
  const images = await getImages(Object.keys(imagesUser));
  const imagesReviewCsv = buildImagesReviewCsv(imagesUser, images);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=images-review.csv'
    },
    body: imagesReviewCsv
  };
};
