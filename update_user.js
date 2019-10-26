const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const moment = require('moment');

const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const updateableAttrs = [
  'first_name',
  'last_name',
  'phone',
  'car',
  'user_identifications',
  'password_hash'
];

const UserTableName = process.env.dynamodb_users_table_name;

function parseUpdateParams(body, updateableAttrs, updatedAt) {
  let expression = 'SET ';
  const values = {};
  for (let i = 0; i < updateableAttrs.length; i++) {
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
    ProjectionExpression: 'user_id, password_hash'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

function hashPassword(userPassword) {
  const Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const body = JSON.parse(event.body);
  if (body.current_password && body.new_password) {
    const userFromLogin = await getUser(userId);
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
  await updateUser(userId, body);

  const message = { updated: true };
  const result = {
    body: JSON.stringify(message)
  };

  return result;
};
