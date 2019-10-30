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

async function createUser(
  userEmail,
  userPassword,
  firstName,
  lastName,
  userPhone,
  userIdentifications,
  rawData
) {
  const eventId = `evt_${uuidv4()}`;
  const userId = `usr_${uuidv4()}`;
  const bearerToken = uuidv4();
  const passwordHash = hashPassword(userPassword);
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const eventData = rawData;
  delete eventData.password;
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Put: {
              TableName: UsersTableName,
              Item: {
                user_id: userId,
                email: userEmail,
                password_hash: passwordHash,
                bearer_token: bearerToken,
                first_name: firstName,
                last_name: lastName,
                phone: userPhone,
                user_verifications: {
                  email: false,
                  phone: false,
                  identity: { front: false, back: false },
                  driver_license: { front: false, back: false }
                },
                user_identifications: {
                  selfie_image: userIdentifications.selfie_image,
                  identification: {
                    front: userIdentifications.identification_image_front,
                    back: userIdentifications.identification_image_back
                  },
                  driver_license: {
                    front: userIdentifications.driver_license_image_front,
                    back: userIdentifications.driver_license_image_back
                  }
                },
                vehicles: [],
                created_at: timestamp,
                updated_at: timestamp
              }
            }
          },
          {
            Put: {
              TableName: EventsTableName,
              Item: {
                event_id: eventId,
                user_id: userId,
                resource_id: userId,
                resource: 'user',
                action: 'create',
                event_data: eventData,
                created_at: timestamp
              }
            }
          }
        ]
      })
      .promise();
    return { userId, bearerToken };
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const userEmail = body.email;
  const userPassword = body.password;
  const firstName = body.first_name;
  const lastName = body.last_name;
  const userPhone = body.phone;
  const userIdentifications = body.user_identifications;

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

  const { userId, bearerToken } = await createUser(
    userEmail,
    userPassword,
    firstName,
    lastName,
    userPhone,
    userIdentifications,
    body
  );
  const selfieUrl = userIdentifications.selfie_image
    ? await getImageUrl(userIdentifications.selfie_image)
    : null;
  const identFrontUrl = userIdentifications.identification_image_front
    ? await getImageUrl(userIdentifications.identification_image_front)
    : null;
  const identBackUrl = userIdentifications.identification_image_back
    ? await getImageUrl(userIdentifications.identification_image_back)
    : null;
  const driverFrontUrl = userIdentifications.driver_license_image_front
    ? await getImageUrl(userIdentifications.driver_license_image_front)
    : null;
  const driverBackUrl = userIdentifications.driver_license_image_back
    ? await getImageUrl(userIdentifications.driver_license_image_back)
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
      email: false,
      phone: false,
      identity: false,
      driver_license: false
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
