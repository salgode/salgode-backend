const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getTrip(tripId) {
  const params = {
    TableName: process.env.dynamodb_table_name_trip,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression: 'trip_id, created_at, route_points, trip_status, etd'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

// Same code as on get_spot.js 4:1
async function getSpot(spotID) {
  const params = {
    TableName: process.env.dynamodb_table_name_spot,
    Key: {
      id: spotID
    },
    ProjectionExpression: 'spot_id, address, city, commune, icon, lat, lon, #name, #type',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#type': 'type'
    },
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function translateSpotId(spotsArray) {
  return await Promise.all(
    spotsArray.map(async (pointId) => {
      return await getSpot(pointId);
    })
  );
}

exports.handler = async (event) => {
  const tripId = event.pathParameters.trip;
  const tripResult = await getTrip(tripId);
  tripResult.trip_route_points = await translateSpotId(tripResult.route_points);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(tripResult)
  };
  return response;
};
