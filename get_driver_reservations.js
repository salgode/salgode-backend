const aws = require('aws-sdk');

const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservations(tripId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'trip_id = :tripId',
    FilterExpression: 'reservation_status = :expectedStatus',
    ExpressionAttributeValues: {
      ':tripId': tripId,
      ':expectedStatus': 'pending'
    },
    ProjectionExpression:
      'reservation_id, reservation_status, trip_id, available_seats, reservation_route'
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const tripId = event.pathParameters.trip;

  const reservations = await getReservations(tripId);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(reservations)
  };
  return response;
};
