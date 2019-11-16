const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const BaseEmailConfirmationUrl = process.env.salgode_email_confirmation_base_url;
const EventsTableName = process.env.dynamodb_events_table_name;
const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const UsersTableName = process.env.dynamodb_users_table_name;
const UsersIndexName = process.env.dynamodb_users_index_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();
const ses = new aws.SES();

function hashPassword(userPassword) {
  const Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

function parseImageUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

function parseConfirmationUrl(userId, token) {
  return `${BaseEmailConfirmationUrl}?user=${userId}&token=${token}`;
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
  return parseImageUrl(ImagesBaseUrl, image.folder_name, image.file_name);
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

async function sendConfirmationEmail(recipientAddress, recipientName, confirmationLink) {
  const params = {
    Destination: {
      ToAddresses: [recipientAddress]
    },
    Message: {
      Subject: { Data: 'Bienvenid@ a SALGODE - Confirma tu email' },
      Body: {
        Text:
        {
          Data:
`Hola ${recipientName}!

List@ para hacer del mundo un lugar mejor?

Confirma tu email con este link ${confirmationLink}

Atentamente,
Equipo #SalgoDe`
        }
      }
    },
    Source: 'noreply@salgode.cl'
  };

  const result = await ses.sendEmail(params).promise();
  return result;
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
  const emailToken = uuidv4();
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
                bearer_token: bearerToken,
                email: userEmail,
                email_token: emailToken,
                password_hash: passwordHash,
                first_name: firstName,
                last_name: lastName,
                phone: userPhone,
                user_identifications: {
                  selfie_image: userIdentifications.selfie_image || null,
                  identification: {
                    front: userIdentifications.identification_image_front || null,
                    back: userIdentifications.identification_image_back || null
                  },
                  driver_license: {
                    front: userIdentifications.driver_license_image_front || null,
                    back: userIdentifications.driver_license_image_back || null
                  }
                },
                user_verifications: {
                  email: false,
                  phone: false,
                  selfie_image: false,
                  selfie_image_checked: false,
                  identification: {
                    front: false,
                    front_checked: false,
                    back: false,
                    back_checked: false
                  },
                  driver_license: {
                    front: false,
                    front_checked: false,
                    back: false,
                    back_checked: false
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
    return { userId, bearerToken, emailToken };
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const userEmail = body.email.toLowerCase();
  const userPassword = body.password;
  const firstName = body.first_name;
  const lastName = body.last_name;
  const userPhone = body.phone;
  const userIdentifications = body.user_identifications;

  if (
    !userEmail || !userPassword || !firstName || !lastName || !userPhone
    || !userIdentifications || !userIdentifications.selfie_image
  ) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'user',
        message: 'Wrong or missing parameters'
      })
    };
  }

  const emailIsUsed = await checkEmail(userEmail);
  if (emailIsUsed) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Email has already been used' })
    };
  }

  let selfieUrl;
  let identFrontUrl;
  let identBackUrl;
  let driverFrontUrl;
  let driverBackUrl;

  try {
    selfieUrl = userIdentifications.selfie_image
      ? await getImageUrl(userIdentifications.selfie_image)
      : null;
    identFrontUrl = userIdentifications.identification_image_front
      ? await getImageUrl(userIdentifications.identification_image_front)
      : null;
    identBackUrl = userIdentifications.identification_image_back
      ? await getImageUrl(userIdentifications.identification_image_back)
      : null;
    driverFrontUrl = userIdentifications.driver_license_image_front
      ? await getImageUrl(userIdentifications.driver_license_image_front)
      : null;
    driverBackUrl = userIdentifications.driver_license_image_back
      ? await getImageUrl(userIdentifications.driver_license_image_back)
      : null;
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'user',
        message: 'Wrong or missing parameters'
      })
    };
  }

  const { userId, bearerToken, emailToken } = await createUser(
    userEmail,
    userPassword,
    firstName,
    lastName,
    userPhone,
    userIdentifications,
    body
  );

  const confirmationUrl = parseConfirmationUrl(userId, emailToken);

  await sendConfirmationEmail(userEmail, firstName, confirmationUrl);

  const responseBody = {
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
