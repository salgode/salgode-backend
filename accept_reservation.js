const aws = require('aws-sdk');
const moment = require('moment');

const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const TripsTableName = process.env.dynamodb_trips_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservedSeats(reservationId) {
  const params = {
    TableName: ReservationsTableName,
    Key: {
      reservation_id: reservationId
    },
    ProjectionExpression: 'reserved_seats'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item.reserved_seats;
}

async function acceptReservation(reservedSeats, reservationId, tripId) {
  const updatedStatus = 'accepted';
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: ReservationsTableName,
              Key: {
                reservation_id: reservationId
              },
              UpdateExpression: 'set reservation_status = :new_status',
              ExpressionAttributeValues: {
                ':new_status': updatedStatus
              }
            }
          },
          {
            Update: {
              TableName: TripsTableName,
              Key: {
                trip_id: tripId
              },
              ConditionExpression: 'available_seats >= :reserved_seats',
              UpdateExpression:
                'set available_seats = available_seats - :reserved_seats, updated_at = :now',
              ExpressionAttributeValues: {
                ':reserved_seats': reservedSeats,
                ':now': timestamp
              }
            }
          }
        ]
      })
      .promise();
    return { reservation_id: reservationId, reservation_status: updatedStatus };
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const tripId = event.pathParameters.trip;
  const reservationId = event.pathParameters.reservation;
  const reservedSeats = await getReservedSeats(reservationId);

  const result = await acceptReservation(reservedSeats, reservationId, tripId);

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
