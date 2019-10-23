const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

async function getTripAsDriver(userId) {
  const params = {
    TableName: process.env.dynamodb_trips_table_name,
    IndexName: 'driver_id-index',
    KeyConditionExpression: '#driver = :driver',
    ExpressionAttributeNames: {
      '#driver': 'driver_id'
    },
    ExpressionAttributeValues: {
      ':driver': userId
    }
  };
  const data = await docClient.query(params).promise();
  return data.Items;
}

async function getTripForUser(userId) {
  const params = {
    TableName: process.env.dynamodb_trips_slot_table_name,
    IndexName: 'user_id-index',
    KeyConditionExpression: '#user = :user',
    ExpressionAttributeNames: {
      '#user': 'user_id'
    },
    ExpressionAttributeValues: {
      ':user': userId
    }
  };
  const data = await docClient.query(params).promise();
  return data.Items;
}

async function getTrip(tripId) {
  const params = {
    TableName: process.env.dynamodb_trips_table_name,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression: 'trip_id, created_at, route_points, trip_status, etd'
  };
  const data = await docClient.get(params).promise();
  return data.Item;
}

async function translateTripId(tripSlotsArray) {
  return Promise.all(
    tripSlotsArray.map(async (tripSlot) => getTrip(tripSlot.trip_id))
  );
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = event.pathParameters.id;
  const query = event.queryStringParameters && event.queryStringParameters.role ? event.queryStringParameters.role : false;
  let allDriverTrips = [];
  let allUserTripIds = [];
  switch (query) {
    case 'pax':
      allUserTripIds = await getTripForUser(userId);
      break;
    case 'driver':
      allDriverTrips = await getTripAsDriver(userId);
      break;
    default:
      allDriverTrips = await getTripAsDriver(userId);
      allUserTripIds = await getTripForUser(userId);
      break;
  }
  let allTrips = await translateTripId(allUserTripIds);
  allTrips = allTrips.concat(allDriverTrips);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(allTrips)
  };
  return response;
};
