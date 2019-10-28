const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const EventsTableName = process.env.dynamodb_events_table_name;
const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const UsersTableName = process.env.dynamodb_users_table_name;
const UsersIndexName = process.env.dynamodb_users_index_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function hashPassword(userPassword) {
  const Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

async function createEvent(userId, resourceId, resource, action, data) {
  const eventId = `evt_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: EventsTableName,
    Item: {
      event_id: eventId,
      user_id: userId,
      resource_id: resourceId,
      resource,
      action,
      event_data: data,
      created_at: timestamp
    }
  };
  await dynamoDB.put(params).promise();
}

async function checkEmail(userEmail) {
  const params = {
    TableName: UsersTableName,
    IndexName: UsersIndexName,
    ProjectionExpression: 'user_id, email',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': userEmail
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Count;
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
    TableName: UsersTableName,
    Item: {
      user_id: userId,
      email: userEmail,
      password_hash: passwordHash,
      bearer_token: bearerToken,
      first_name: firstName,
      last_name: lastName,
      phone: userPhone,
      user_identifications: {
        selfie_image: identificationImages.selfie_image,
        identification: {
          front: identificationImages.identification_image_front,
          back: identificationImages.identification_image_back
        },
        driver_license: {
          front: identificationImages.driver_license_image_front,
          back: identificationImages.driver_license_image_back
        }
      },
      vehicles: [],
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
  await createEvent(userId, userId, 'user', 'create', body);
  const selfieUrl = identificationImages.selfie_image
    ? await getImageUrl(identificationImages.selfie_image)
    : null;
  const identFrontUrl = identificationImages.identification_image_front
    ? await getImageUrl(identificationImages.identification_image_front)
    : null;
  const identBackUrl = identificationImages.identification_image_back
    ? await getImageUrl(identificationImages.identification_image_back)
    : null;
  const driverFrontUrl = identificationImages.driver_license_image_front
    ? await getImageUrl(identificationImages.driver_license_image_front)
    : null;
  const driverBackUrl = identificationImages.driver_license_image_back
    ? await getImageUrl(identificationImages.driver_license_image_back)
    : null;
  const responseBody = {
    created: true,
    bearer_token: bearerToken,
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email: userEmail,
    phone: userPhone,
    avatar: selfieUrl,
    user_verifications: {
      phone: !!userPhone,
      identity:
        !!identificationImages.selfie_image
        && !!identificationImages.identification_image_front
        && !!identificationImages.identification_image_back,
      driver_license:
        !!identificationImages.driver_license_image_front
        && !!identificationImages.driver_license_image_back
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
};
