const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const dynamoDB = new aws.DynamoDB.DocumentClient();

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

async function createTrip(driverId, vehicleId, availableSeats, etdInfo, routePoints) {
  const tripId = `tri_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: process.env.dynamodb_table_name,
    Item: {
      trip_id: tripId,
      driver_id: driverId,
      vehicle_id: vehicleId,
      etd_info: etdInfo,
      available_seats: availableSeats,
      route_points: routePoints,
      trip_status: 'open',
      current_point: -1,
      created_at: timestamp,
      updated_at: timestamp
    }
  };
  await dynamoDB.put(params).promise();
  return [tripId, timestamp];
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const etdInfo = body.etd_info;
  const routePoints = body.route_points;
  const vehicleId = body.vehicle_id;
  const availableSeats = body.available_seats;

  if (
    !etdInfo || isEmpty(etdInfo) || !routePoints || !(routePoints.length > 0)
    || !vehicleId || !(availableSeats > 0)
  ) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'trip',
        message: 'Wrong or missing parameters'
      })
    };
  }

  const [tripId, timestamp] = await createTrip(
    userId, vehicleId, availableSeats, etdInfo, routePoints
  );

  return {
    statusCode: 201,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'create',
      success: true,
      resource: 'trip',
      resource_id: tripId,
      performed_at: timestamp
    })
  };
};
