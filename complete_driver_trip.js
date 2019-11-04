const aws = require('aws-sdk');
const moment = require('moment');

const TripsTableName = process.env.dynamodb_trips_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function completeTrip(tripId, userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
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

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const tripId = event.pathParameters.trip;

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
