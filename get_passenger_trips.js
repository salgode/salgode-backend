const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

const TripsTableName = process.env.dynamodb_trips_table_name;
const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;

function mapTripKeys(tripsIds) {
  return tripsIds.map((tripId) => ({
    trip_id: tripId
  }));
}

async function getReservations(userId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'passenger_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getTripsByIds(tripsIds) {
  const params = {
    RequestItems: {
      [TripsTableName]: {
        Keys: mapTripKeys(tripsIds),
        AttributesToGet: [
          'trip_id',
          'trip_status',
          'trip_times',
          'driver_id',
          'vehicle_id',
          'available_seats',
          'current_point',
          'route_points'
        ],
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[TripsTableName];
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const reservations = await getReservations(userId);
  const tripIds = reservations.map((r) => r.trip_id);
  const trips = await getTripsByIds(tripIds);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(trips)
  };
  return response;
};
