const aws = require('aws-sdk');
const moment = require('moment');

let TripsTableName = process.env.dynamodb_trips_table_name;

function stagingOverwrite() {
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function completeTrip(tripId, userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    UpdateExpression:
      'set trip_status = :newStatus, updated_at = :now',
    ConditionExpression:
      'trip_status = :expectedStatus and driver_id = :self',
    ExpressionAttributeValues: {
      ':newStatus': 'completed',
      ':now': timestamp,
      ':self': userId,
      ':expectedStatus': 'in_progress'
    }
  };
  return dynamoDB.update(params).promise();
}

async function getTrip(tripId) {
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression: 'driver_id'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const tripId = event.pathParameters.trip;

  const trip = await getTrip(tripId);

  if (trip.driver_id !== userId) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'complete',
        success: false,
        resource: 'trip',
        message: 'Unauthorized'
      })
    };
  }

  try {
    await completeTrip(tripId, userId);
  } catch (err) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'complete',
        success: false,
        resource: 'trip',
        resource_id: tripId
      })
    };
  }
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'complete',
      success: true,
      resource: 'trip',
      resource_id: tripId
    })
  };
};
