const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

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
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const body = JSON.parse(event.body);
  const etdInfo = body.etd_info;
  const routePoints = body.route_points;
  const vehicleId = body.vehicle_id;
  const availableSeats = body.available_seats;

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
