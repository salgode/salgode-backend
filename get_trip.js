const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getTrip(tripId) {
  let params = {
    TableName: 'SalgoDe_Trips',
    ScanIndexForward: true,
    ProjectionExpression:
      '#trip_id, #created_at, #route_points, #trip_status, #etd, #car_id, #driver_id, #next_stop, #available_seats, #updatedAt',
    ExpressionAttributeNames: {
      '#trip_id': 'trip_id',
      '#created_at': 'created_at',
      '#route_points': 'route_points',
      '#trip_status': 'trip_status',
      '#etd': 'etd',
      '#car_id': 'car_id',
      '#driver_id': 'driver_id',
      '#next_stop': 'next_stop',
      '#available_seats': 'available_seats',
      '#updatedAt': 'updatedAt'
    },
    KeyConditionExpression: 'trip_id = :trip_id',
    ExpressionAttributeValues: {
      ':trip_id': tripId
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getSpot(spotId) {
  let params = {
    TableName: 'SalgodeSpot',
    ScanIndexForward: true,
    ProjectionExpression:
      '#id, #address, #city, #commune, #icon, #lat, #lon, #name, #type',
    ExpressionAttributeNames: {
      '#id': 'id',
      '#address': 'address',
      '#city': 'city',
      '#commune': 'commune',
      '#icon': 'icon',
      '#lat': 'lat',
      '#lon': 'lon',
      '#name': 'name',
      '#type': 'type'
    },
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': spotId
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

async function getSpotAsync(route_points) {
  const promises = route_points.map(async pointId => {
    console.log(pointId);
    return await getSpot(pointId);
  });
  return Promise.all(promises);
}

exports.handler = async event => {
  let tripId = event.pathParameters.trip;
  let result = await getTrip(tripId);
  let routePoints = await getSpotAsync(result[0].route_points);
  result[0].route_points = routePoints;
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
  return response;
};
