/* eslint-disable import/no-unresolved */
const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

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
  const driverId = event.driver_id;
  const { etd } = event;
  const routePoints = event.route_points;

  await createTrip(driverId, etd, routePoints);

  const result = {
    created: true
  };

  return result;
};
