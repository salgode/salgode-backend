const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
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
  let values = {};
  for (let i = 0; i < updateableAttrs.length; i++) {
    console.log('Checking updateableAttrs');
    console.log(body[updateableAttrs[i]]);
    if (body[updateableAttrs[i]]) {
      expression += `${updateableAttrs[i]} = :${updateableAttrs[i]}, `;
      values[`:${updateableAttrs[i]}`] = body[updateableAttrs[i]];
    }
    console.log('ACTUAL EXPRESSION', expression);
    console.log('ACTUAL VALUES', values);
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
  let updatedAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  let [updateExpression, expressionAttributeValues] = parseUpdateParams(
    body,
    updateableAttrs,
    updatedAt
  );

  console.log('MADE EXPRESSION', updateExpression);
  console.log('MADE VALUES', expressionAttributeValues);

  let params = {
    TableName: process.env.dynamodb_table_name,
    Key: {
      user_id: userId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'NONE'
  };
  let data = await dynamoDB.update(params).promise();
  return data;
}

exports.handler = async event => {
  let userId = event.pathParameters.id;
  let body = JSON.parse(event.body);
  await updateUser(userId, body);

  let message = { updated: true };
  let result = {
    body: JSON.stringify(message)
  };

  return result;
};
