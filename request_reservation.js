const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function createTripReservation(tripId, userId, reservedSeats, route) {
  const reservationId = `res_${uuidv4()}`;
  const reservationStatus = 'pending';
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            ConditionCheck: {
              TableName: process.env.dynamodb_trips_table_name,
              Key: {
                trip_id: tripId
              },
              ConditionExpression: 'available_seats >= :reserved_seats',
              ExpressionAttributeValues: {
                ':reserved_seats': reservedSeats
              }
            }
          },
          {
            Put: {
              TableName: process.env.dynamodb_reservations_table_name,
              Item: {
                reservation_id: reservationId,
                trip_id: tripId,
                passenger_id: userId,
                route: {
                  start: route.start,
                  end: route.end
                },
                reserved_seats: reservedSeats,
                reservation_status: reservationStatus,
                check_in: false,
                check_out: false,
                created_at: timestamp,
                updated_at: timestamp
              }
            }
          }
        ]
      })
      .promise();
    return { reservation_id: reservationId, reservation_status: reservationStatus };
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const body = JSON.parse(event.body);
  const tripId = body.trip_id;
  const routeObj = body.route;
  const reservedSeats = body.reserved_seats || 1;
  const result = await createTripReservation(tripId, userId, reservedSeats, routeObj);

  if (result) {
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  }
  return {
    statusCode: 409,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ created: false })
  };
};
