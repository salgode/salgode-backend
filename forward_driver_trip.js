const aws = require('aws-sdk');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const TripsTableName = process.env.dynamodb_trips_table_name;

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

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const tripId = event.pathParameters.trip;

  const result = await forwardTrip(tripId, userId);
  const responseBody = {
    action: 'forward',
    success: true,
    resource: 'trip',
    resource_id: tripId,
    next_point: result.current_point + 1 < result.route_points.length
      ? result.route_points[result.current_point + 1]
      : null
  };
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
