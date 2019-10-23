const AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();

async function getTripAsDriver(user_id) {
  let params = {
    TableName: process.env.dynamodb_trips_table_name,
    IndexName: "driver_id-index",
    KeyConditionExpression: "#driver = :driver",
    ExpressionAttributeNames: {
      "#driver": "driver_id"
    },
    ExpressionAttributeValues: {
      ":driver": user_id
    }
  };
  const data = await docClient.query(params).promise();
  return data.Items;
}

async function getTripForUser(user_id) {
  let params = {
    TableName: process.env.dynamodb_trips_slot_table_name,
    IndexName: "user_id-index",
    KeyConditionExpression: "#user = :user",
    ExpressionAttributeNames: {
      "#user": "user_id"
    },
    ExpressionAttributeValues: {
      ":user": user_id
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
  return await Promise.all(
    tripSlotsArray.map(async (tripSlot) => {
      return await getTrip(tripSlot.trip_id);
    })
  );
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const user_id = event.pathParameters.id
  const query = event.queryStringParameters && event.queryStringParameters.role ? event.queryStringParameters.role : false;
  const allDriverTrips = await getTripAsDriver(user_id);
  const allUserTripIds = await getTripForUser(user_id);
  let allTrips = await translateTripId(allUserTripIds)
  if (!query) {
    allTrips = allTrips.concat(allDriverTrips);
  } else if (query === "driver") {
    allTrips = allDriverTrips
  }
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(allTrips)
  };
  return response;
};