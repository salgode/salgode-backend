const aws = require('aws-sdk');
const moment = require('moment');

let TripsTableName = process.env.dynamodb_trips_table_name;

function stagingOverwrite() {
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function forwardTrip(tripId, userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const expectedStatus = 'in_progress';
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    UpdateExpression: 'set current_point = current_point + :val, updated_at = :now',
    ConditionExpression: 'trip_status = :expectedStatus and driver_id = :self',
    ExpressionAttributeValues: {
      ':val': 1,
      ':now': timestamp,
      ':self': userId,
      ':expectedStatus': expectedStatus
    },
    ReturnValues: 'ALL_NEW'
  };
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

async function getTrip(tripId) {
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression: 'driver_id, current_point, route_points'
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
        action: 'forward',
        success: false,
        resource: 'trip',
        message: 'Unauthorized'
      })
    };
  }

  if (trip.current_point + 1 === trip.route_points.length) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'forward',
        success: false,
        resource: 'trip',
        resource_id: tripId,
        message: 'Already at the last route point'
      })
    };
  }

  const result = await forwardTrip(tripId, userId);
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'forward',
      success: true,
      resource: 'trip',
      resource_id: tripId,
      next_point: result.current_point + 1 < result.route_points.length
        ? result.route_points[result.current_point + 1]
        : null
    })
  };
};
