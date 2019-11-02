const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');

const UsersTableName = process.env.dynamodb_users_table_name;
const UsersIndexName = process.env.dynamodb_users_index_name;
const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUserFromLogin(userEmail) {
  const params = {
    TableName: UsersTableName,
    IndexName: UsersIndexName,
    ProjectionExpression:
      'user_id, password_hash, vehicle, bearer_token, first_name, last_name, email, phone, user_identifications, user_verifications',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': userEmail
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

async function getImageUrl(imageId) {
  const params = {
    TableName: ImagesTableName,
    Key: {
      image_id: imageId
    },
    ProjectionExpression: 'file_name, folder_name'
  };
  const data = await dynamoDB.get(params).promise();
  const image = data.Item;
  return parseUrl(ImagesBaseUrl, image.folder_name, image.file_name);
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const loginEmail = body.email;
  const loginPassword = body.password;
  const userFromDb = await getUserFromLogin(loginEmail);

  if (!userFromDb) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }

  const selfieUrl = userFromDb.user_identifications.selfie_image
    ? await getImageUrl(userFromDb.user_identifications.selfie_image)
    : null;
  const identFrontUrl = userFromDb.user_identifications.identification.front
    ? await getImageUrl(userFromDb.user_identifications.identification.front)
    : null;
  const identBackUrl = userFromDb.user_identifications.identification.back
    ? await getImageUrl(userFromDb.user_identifications.identification.back)
    : null;
  const driverFrontUrl = userFromDb.user_identifications.driver_license.front
    ? await getImageUrl(userFromDb.user_identifications.driver_license.front)
    : null;
  const driverBackUrl = userFromDb.user_identifications.driver_license.back
    ? await getImageUrl(userFromDb.user_identifications.driver_license.back)
    : null;

  if (bcrypt.compareSync(loginPassword, userFromDb.password_hash)) {
    const responseBody = {
      bearer_token: userFromDb.bearer_token,
      user_id: userFromDb.user_id,
      first_name: userFromDb.first_name,
      last_name: userFromDb.last_name,
      email: userFromDb.email,
      phone: userFromDb.phone,
      avatar: selfieUrl,
      user_verifications: {
        email: userFromDb.user_verifications.email,
        phone: userFromDb.user_verifications.phone,
        identity:
          userFromDb.user_verifications.identification.front
          && userFromDb.user_verifications.identification.back,
        driver_license:
          userFromDb.user_verifications.driver_license.front
          && userFromDb.user_verifications.driver_license.back
      },
      user_identifications: {
        selfie: selfieUrl,
        identification: {
          front: identFrontUrl,
          back: identBackUrl
        },
        driver_license: {
          front: driverFrontUrl,
          back: driverBackUrl
        }
      }
    };
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
  return {
    statusCode: 401,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Unauthorized' })
  };
};
