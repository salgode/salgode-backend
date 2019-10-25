const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservations(userId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    KeyConditionExpression: 'passenger_id = :passengerId',
    ExpressionAttributeValues: {
      ':passengerId': userId
    },
    ProjectionExpression:
      'reservation_id, reserved_seats, route, reservation_status'
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const reservations = await getReservations(userId);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(reservations)
  };
  return response;
};
