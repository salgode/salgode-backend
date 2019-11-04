const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const EventsTableName = process.env.dynamodb_events_table_name;
const ImagesTableName = process.env.dynamodb_images_table_name;
const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

const updateableAttrs = [
  'first_name',
  'last_name',
  'phone',
  'user_identifications',
  'user_verifications',
  'password_hash'
];

function hashPassword(userPassword) {
  const Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
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
  return [image.folder_name, image.file_name];
}

function parseBody(body, user) {
  return {
    first_name: body.first_name,
    last_name: body.last_name,
    phone: body.phone,
    user_verifications: {
      email: user.user_verifications.email,
      phone:
      (body.phone)
        ? false
        : user.user_verifications.phone,
      selfie_image:
        (body.user_identifications && body.user_identifications.selfie_image)
          ? false
          : user.user_verifications.selfie_image,
      identification: {
        front:
          (body.user_identifications
          && body.user_identifications.identification
          && body.user_identifications.identification.front)
            ? false
            : user.user_verifications.identification.front,
        back:
          (body.user_identifications
          && body.user_identifications.identification
          && body.user_identifications.identification.back)
            ? false
            : user.user_verifications.identification.back
      },
      driver_license: {
        front:
          (body.user_identifications
          && body.user_identifications.driver_license
          && body.user_identifications.driver_license.front)
            ? false
            : user.user_verifications.driver_license.front,
        back:
          (body.user_identifications
          && body.user_identifications.driver_license
          && body.user_identifications.driver_license.back)
            ? false
            : user.user_verifications.driver_license.back
      }
    },
    user_identifications: {
      selfie_image:
        (body.user_identifications && body.user_identifications.selfie_image)
        || user.user_identifications.selfie_image,
      identification: {
        front:
          (body.user_identifications
          && body.user_identifications.identification
          && body.user_identifications.identification.front)
          || user.user_identifications.identification.front,
        back:
          (body.user_identifications
          && body.user_identifications.identification
          && body.user_identifications.identification.back)
          || user.user_identifications.identification.back
      },
      driver_license: {
        front:
          (body.user_identifications
          && body.user_identifications.driver_license
          && body.user_identifications.driver_license.front)
          || user.user_identifications.driver_license.front,
        back:
          (body.user_identifications
          && body.user_identifications.driver_license
          && body.user_identifications.driver_license.back)
          || user.user_identifications.driver_license.back
      }
    }
  };
}

function parseUpdateParams(body, updatedAt) {
  let expression = 'SET ';
  const values = {};
  for (let i = 0; i < updateableAttrs.length; i += 1) {
    if (body[updateableAttrs[i]]) {
      expression += `${updateableAttrs[i]} = :${updateableAttrs[i]}, `;
      values[`:${updateableAttrs[i]}`] = body[updateableAttrs[i]];
    }
  }
  if (Object.keys(values).length) {
    expression += 'updated_at = :updatedAt';
    values[':updatedAt'] = updatedAt;
  } else {
    throw new Error('[BadRequest] No updateable attributes specified');
  }
  return [expression, values];
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression:
      'user_id, first_name, last_name, phone, password_hash, user_identifications, user_verifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function updateUser(userId, updateParams, eventData) {
  const eventId = `evt_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const [updateExpression, expressionAttributeValues] = parseUpdateParams(
    updateParams,
    timestamp
  );
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: UsersTableName,
              Key: {
                user_id: userId
              },
              UpdateExpression: updateExpression,
              ExpressionAttributeValues: expressionAttributeValues
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
                action: 'update',
                event_data: eventData,
                created_at: timestamp
              }
            }
          }
        ]
      })
      .promise();
    return userId;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const user = await getUser(userId);

  const updateParams = parseBody(body, user);

  if (body.new_password) {
    if (body.current_password && bcrypt.compareSync(body.current_password, user.password_hash)) {
      updateParams.password_hash = hashPassword(body.new_password);
      delete body.new_password;
      delete body.current_password;
    } else {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(({
          message: 'Unauthorized'
        }))
      };
    }
  }

  if (body.user_identifications && !isEmpty(body.user_identifications)) {
    try {
      if (updateParams.user_identifications.selfie_image) {
        await getImageUrl(updateParams.user_identifications.selfie_image);
      }
      if (updateParams.user_identifications.driver_license.front) {
        await getImageUrl(updateParams.user_identifications.driver_license.front);
      }
      if (updateParams.user_identifications.driver_license.back) {
        await getImageUrl(updateParams.user_identifications.driver_license.back);
      }
      if (updateParams.user_identifications.driver_license.front) {
        await getImageUrl(updateParams.user_identifications.driver_license.front);
      }
      if (updateParams.user_identifications.driver_license.back) {
        await getImageUrl(updateParams.user_identifications.driver_license.back);
      }
    } catch (err) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          action: 'update',
          success: false,
          resource: 'user',
          message: 'Request contains errors'
        })
      };
    }
  }

  const result = await updateUser(userId, updateParams, body);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(
        {
          action: 'update',
          success: true,
          resource: 'user',
          resource_id: userId
        }
      )
    };
  }
  return {
    statusCode: 400,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'update',
      success: false,
      resource: 'user',
      message: 'Request contains errors'
    })
  };
};
