const aws = require('aws-sdk');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const TripsTableName = process.env.dynamodb_trips_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function startTrip(tripId, userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const newStatus = 'in_progress';
  const expectedStatus = 'open';
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    UpdateExpression:
      'set trip_status = :new_status, current_point = :val, updated_at = :now',
    ConditionExpression:
      'trip_status = :expected_status and driver_id = :self',
    ExpressionAttributeValues: {
      ':val': 0,
      ':new_status': newStatus,
      ':now': timestamp,
      ':expected_status': expectedStatus,
      ':self': userId
    },
    ReturnValues: 'UPDATED_NEW'
  };
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const tripId = event.pathParameters.trip;

  const result = await startTrip(tripId, userId);
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
};