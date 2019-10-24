const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservations(userId) {
  const params = {
    TableName: process.env.dynamodb_reservations_table_name,
    IndexName: process.env.dynamodb_index_name,
    KeyConditionExpression: 'passenger_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getTrip(tripId) {
  const params = {
    TableName: process.env.dynamodb_trips_table_name,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression: 'trip_id, route_points, trip_status, etd'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getTrips(reservations) {
  return Promise.all(
    reservations.slice(0, 15).map(async (r) => getTrip(r.trip_id))
  );
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const reservations = await getReservations(userId);
  const allPassengerTrips = await getTrips(reservations);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(allPassengerTrips)
  };
  return response;
};
