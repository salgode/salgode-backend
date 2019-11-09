const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const TripsTableName = process.env.dynamodb_trips_table_name;
const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

async function createTrip(driverId, vehicleId, availableSeats, etdInfo, routePoints) {
  const tripId = `tri_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: TripsTableName,
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

function alreadyPassed(time) {
  return moment(time) < moment();
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_verifications.driver_license'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const etdInfo = body.etd_info;
  const routePoints = body.route_points;
  const vehicleId = body.vehicle_id;
  const availableSeats = body.available_seats;

  if (
    !etdInfo || isEmpty(etdInfo) || !etdInfo.etd || alreadyPassed(etdInfo.etd)
    || !routePoints || !(routePoints.length > 0) || !vehicleId || !(availableSeats > 0)
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

  const user = await getUser(userId);
  if (
    !user.user_verifications.driver_license.front
    || !user.user_verifications.driver_license.back
  ) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'trip',
        message: 'Missing driver license verification'
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
