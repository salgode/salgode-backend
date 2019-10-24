const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function createTrip(driverId, etd, routePoints) {
  const tripId = `tri_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: process.env.dynamodb_table_name,
    Item: {
      trip_id: tripId,
      driver_id: driverId,
      etd,
      available_seats: 4,
      route_points: routePoints,
      trip_status: 'open',
      created_at: timestamp,
      updated_at: timestamp
    }
  };
  const data = await dynamoDB.put(params).promise();
  return data;
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const body = JSON.parse(event.body);
  const { etd } = body;
  const routePoints = body.route_points;

  await createTrip(userId, etd, routePoints);

  return {
    statusCode: 201,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ created: true })
  };
};
