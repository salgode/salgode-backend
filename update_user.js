const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const dynamoDB = new aws.DynamoDB.DocumentClient();

const updateableAttrs = [
  'first_name',
  'last_name',
  'phone',
  'user_identifications',
  'password_hash'
];

const UserTableName = process.env.dynamodb_users_table_name;
const EventsTableName = process.env.dynamodb_events_table_name;

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
    expression += 'updatedAt = :updatedAt';
    values[':updatedAt'] = updatedAt;
  } else {
    throw new Error('[BadRequest] No updateable attributes specified');
  }
  return [expression, values];
}

async function updateUser(userId, body) {
  const updatedAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const [updateExpression, expressionAttributeValues] = parseUpdateParams(
    body,
    updateableAttrs,
    updatedAt
  );

  const params = {
    TableName: UserTableName,
    Key: {
      user_id: userId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'NONE'
  };
  const data = await dynamoDB.update(params).promise();
  return data;
}

async function getUser(userId) {
  const params = {
    TableName: UserTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, user_identifications, password_hash'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

function hashPassword(userPassword) {
  const Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const userFromLogin = await getUser(userId);
  if (body.current_password && body.new_password) {
    const hashedPassword = userFromLogin.password_hash;
    if (bcrypt.compareSync(body.current_password, hashedPassword)) {
      body.password_hash = hashPassword(body.new_password);
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
  const updateParams = {
    user_identifications: {
      ...userFromLogin.user_identifications,
      ...body.user_identifications
    }
  };
  await updateUser(userId, updateParams);
  if (body.new_password) { delete body.new_password; }
  await createEvent(userId, userId, 'user', 'update', body);

  const message = {
    action: 'updated', success: true, resource: 'user', resource_id: userId
  };
  const result = {
    body: JSON.stringify(message)
  };

  return result;
};
