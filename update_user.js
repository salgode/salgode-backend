const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const moment = require('moment');

const updateableAttrs = [
  'first_name',
  'last_name',
  'phone',
  'car',
  'user_identifications'
];

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
    TableName: process.env.dynamodb_table_name,
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

exports.handler = async (event) => {
  const userId = event.pathParameters.id;
  const body = JSON.parse(event.body);
  await updateUser(userId, body);

  const message = { updated: true };
  const result = {
    body: JSON.stringify(message)
  };

  return result;
};
