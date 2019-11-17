const aws = require('aws-sdk');
const moment = require('moment');

const TripsIndexName = process.env.dynamodb_trips_index_name;
let TripsTableName = process.env.dynamodb_trips_table_name;

function stagingOverwrite() {
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

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
      'set trip_status = :new_status, current_point = :zero, updated_at = :now',
    ConditionExpression:
      'trip_status = :expected_status and driver_id = :self',
    ExpressionAttributeValues: {
      ':zero': 0,
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

async function getTripInProgress(userId) {
  const params = {
    TableName: TripsTableName,
    IndexName: TripsIndexName,
    KeyConditionExpression: 'driver_id = :userId',
    FilterExpression:
      'trip_status = :expectedStatus',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':expectedStatus': 'in_progress'
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const tripId = event.pathParameters.trip;

  const tripInProgress = await getTripInProgress(userId);
  if (tripInProgress && !isEmpty(tripInProgress)) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'start', success: false, resource: 'trip', message: 'Trip in progress conflict'
      })
    };
  }

  await startTrip(tripId, userId);
  const responseBody = {
    action: 'start',
    success: true,
    resource: 'trip',
    resource_id: tripId
  };
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
