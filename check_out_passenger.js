const aws = require('aws-sdk');
const moment = require('moment');

const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
let ReservationsTableName = process.env.dynamodb_reservations_table_name;

function stagingOverwrite() {
  ReservationsTableName = `Dev_${process.env.dynamodb_reservations_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservation(userId, tripId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'passenger_id = :passengerId',
    FilterExpression:
      'trip_id = :tripId and check_out = :status',
    ExpressionAttributeValues: {
      ':passengerId': userId,
      ':tripId': tripId,
      ':status': false
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

async function checkOut(reservation) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const params = {
    TableName: ReservationsTableName,
    Key: {
      reservation_id: reservation.reservation_id
    },
    UpdateExpression: 'set check_out = :now, updated_at = :now',
    ExpressionAttributeValues: {
      ':now': timestamp
    }
  };
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const tripId = event.pathParameters.trip;

  const reservation = await getReservation(userId, tripId);
  try {
    await checkOut(reservation);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'checkout',
        success: false,
        resource: 'reservation',
        message: 'Request contains errors'
      })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'checkout',
      success: true,
      resource: 'reservation',
      resource_id: reservation.reservation_id
    })
  };
};
