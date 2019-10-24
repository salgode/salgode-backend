const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservation(reservationId) {
  const params = {
    TableName: process.env.dynamodb_reservations_table_name,
    Key: {
      reservation_id: reservationId
    },
    ProjectionExpression: 'trip_id, reserved_seats, reservation_id'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function acceptReservation(reservation) {
  const updatedStatus = 'accepted';
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: process.env.dynamodb_reservations_table_name,
              Key: {
                reservation_id: reservation.reservation_id
              },
              UpdateExpression: 'set reservation_status = :new_status',
              ExpressionAttributeValues: {
                ':new_status': updatedStatus
              }
            }
          },
          {
            Update: {
              TableName: process.env.dynamodb_trips_table_name,
              Key: {
                trip_id: reservation.trip_id
              },
              ConditionExpression: 'available_seats >= :reserved_seats',
              UpdateExpression:
                'set available_seats = available_seats - :reserved_seats',
              ExpressionAttributeValues: {
                ':reserved_seats': reservation.reserved_seats
              }
            }
          }
        ]
      })
      .promise();
    return { reservation_id: reservation.reservation_id, reservation_status: updatedStatus };
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const reservationId = event.pathParameters.reservation;
  const reservation = await getReservation(reservationId);

  const result = await acceptReservation(reservation);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  }
  return {
    statusCode: 409,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ accepted: false })
  };
};
