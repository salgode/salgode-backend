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
      'user_id, password_hash, vehicle, bearer_token, first_name, last_name, email, phone, user_identifications',
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
  const userFromLogin = await getUserFromLogin(loginEmail);
  const hashedPassword = userFromLogin.password_hash;
  delete userFromLogin.password_hash;

  const selfieUrl = userFromLogin.user_identifications.selfie_image
    ? await getImageUrl(userFromLogin.user_identifications.selfie_image)
    : null;
  const identFrontUrl = userFromLogin.user_identifications.identification.front
    ? await getImageUrl(userFromLogin.user_identifications.identification.front)
    : null;
  const identBackUrl = userFromLogin.user_identifications.identification.back
    ? await getImageUrl(userFromLogin.user_identifications.identification.back)
    : null;
  const driverFrontUrl = userFromLogin.user_identifications.driver_license.front
    ? await getImageUrl(userFromLogin.user_identifications.driver_license.front)
    : null;
  const driverBackUrl = userFromLogin.user_identifications.driver_license.back
    ? await getImageUrl(userFromLogin.user_identifications.driver_license.back)
    : null;

  if (bcrypt.compareSync(loginPassword, hashedPassword)) {
    const responseBody = {
      bearer_token: userFromLogin.bearer_token,
      user_id: userFromLogin.user_id,
      first_name: userFromLogin.first_name,
      last_name: userFromLogin.last_name,
      email: userFromLogin.email,
      phone: userFromLogin.phone,
      avatar: selfieUrl,
      user_verifications: {
        phone: !!userFromLogin.phone,
        identity:
          !!userFromLogin.user_identifications.selfie_image
          && !!userFromLogin.user_identifications.identification.front
          && !!userFromLogin.user_identifications.identification.back,
        driver_license:
          !!userFromLogin.user_identifications.driver_license.front
          && !!userFromLogin.user_identifications.driver_license.back
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
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
  const responseBody = {
    message: 'Unauthorized'
  };
  return {
    statusCode: 401,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
