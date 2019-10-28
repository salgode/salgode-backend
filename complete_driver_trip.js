const aws = require('aws-sdk');
const moment = require('moment');

const TripsTableName = process.env.dynamodb_trips_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function completeTrip(tripId, userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const expectedStatus = 'in_progress';
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    UpdateExpression:
      'set current_point = current_point + :val, trip_status = :newStatus, updated_at = :now',
    ConditionExpression:
      'trip_status = :expectedStatus and driver_id = :self',
    ExpressionAttributeValues: {
      ':val': 1,
      ':newStatus': 'completed',
      ':now': timestamp,
      ':self': userId,
      ':expectedStatus': expectedStatus
    },
    ReturnValues: 'UPDATED_NEW'
  };
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const tripId = event.pathParameters.trip;

  await completeTrip(tripId, userId);
  const responseBody = {
    action: 'complete',
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
