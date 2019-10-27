const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservation(reservationId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    Key: {
      reservation_id: reservationId
    },
    ProjectionExpression:
      'reservation_id, reserved_seats, route, reservation_status'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const reservationId = event.pathParameters.reservation;
  const result = await getReservation(reservationId);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  }
  return {
    statusCode: 404,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Reservation not found' })
  };
};
