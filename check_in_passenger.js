const aws = require('aws-sdk');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservation(userId, tripId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'passenger_id = :passengerId',
    FilterExpression:
      'trip_id = :tripId and reservation_status = :status',
    ExpressionAttributeValues: {
      ':passengerId': userId,
      ':tripId': tripId,
      ':status': 'accepted'
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

async function checkIn(reservation) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: ReservationsTableName,
    Key: {
      reservation_id: reservation.reservation_id
    },
    UpdateExpression: 'set check_in = :val, updated_at = :now',
    ExpressionAttributeValues: {
      ':val': true,
      ':now': timestamp
    },
    ReturnValues: 'UPDATED_NEW'
  };
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const tripId = event.pathParameters.trip;

  const reservation = await getReservation(userId, tripId);
  const result = await checkIn(reservation);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
};
