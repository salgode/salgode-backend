const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getTripAsDriver(userId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    KeyConditionExpression: 'driver_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const trips = await getTripAsDriver(userId);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(trips)
  };
  return response;
};
