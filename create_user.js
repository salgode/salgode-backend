const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const dynamoDB = new aws.DynamoDB.DocumentClient();

function hashPassword(userPassword) {
  const Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

async function checkEmail(userEmail) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    ProjectionExpression: 'user_id, email',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': userEmail
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Count;
}

async function createUser(
  userId,
  bearerToken,
  userEmail,
  passwordHash,
  firstName,
  lastName,
  userPhone,
  identificationImages,
  createdAt
) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    Item: {
      user_id: userId,
      email: userEmail,
      password_hash: passwordHash,
      bearer_token: bearerToken,
      first_name: firstName,
      last_name: lastName,
      phone: userPhone,
      user_identifications: {
        identification_image_front:
          identificationImages.identification_image_front,
        identification_image_back:
          identificationImages.identification_image_back,
        selfie_image: identificationImages.selfie_image,
        driver_license: identificationImages.driver_license
      },
      created_at: createdAt,
      updated_at: createdAt
    }
  };
  const data = await dynamoDB.put(params).promise();
  return data;
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const userEmail = body.email;
  const userPassword = body.password;
  const firstName = body.first_name;
  const lastName = body.last_name;
  const userPhone = body.phone;
  const identificationImages = body.user_identifications;

  const emailIsUsed = await checkEmail(userEmail);

  if (emailIsUsed) {
    const responseBody = {
      message: 'Email has already been used'
    };
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
  const userId = `usr_${uuidv4()}`;
  const bearerToken = uuidv4();
  const createdAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const passwordHash = hashPassword(userPassword);
  await createUser(
    userId,
    bearerToken,
    userEmail,
    passwordHash,
    firstName,
    lastName,
    userPhone,
    identificationImages,
    createdAt
  );
  const responseBody = {
    message: 'User has been created',
    user: {
      user_id: userId,
      email: userEmail,
      bearer_token: bearerToken,
      first_name: firstName,
      last_name: lastName,
      phone: userPhone,
      user_identifications: {
        identification_image_front:
            identificationImages.identification_image_front,
        identification_image_back:
            identificationImages.identification_image_back,
        selfie_image: identificationImages.selfie_image
      }
    }
  };
  return {
    statusCode: 201,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
