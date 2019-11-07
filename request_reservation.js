const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const TripsTableName = process.env.dynamodb_trips_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function checkDuplicated(tripId, userId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    ProjectionExpression: 'trip_id, passenger_id',
    KeyConditionExpression: 'passenger_id = :passengerId',
    FilterExpression: 'trip_id = :tripId and reservation_status <> :reservationStatus',
    ExpressionAttributeValues: {
      ':passengerId': userId,
      ':tripId': tripId,
      ':reservationStatus': 'canceled'
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Count;
}

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
              TableName: TripsTableName,
              Key: {
                trip_id: tripId
              },
              ConditionExpression: 'available_seats >= :reserved_seats and driver_id <> :selfId',
              ExpressionAttributeValues: {
                ':reserved_seats': reservedSeats,
                ':selfId': userId
              }
            }
          },
          {
            Put: {
              TableName: ReservationsTableName,
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
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const tripId = body.trip_id;
  const routeObj = body.route;
  const reservedSeats = body.reserved_seats;

  if (!tripId || !routeObj || !routeObj.start || !routeObj.end
    || !body.reserved_seats || !(body.reserved_seats > 0)) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'reservation',
        message: 'Wrong or missing parameters'
      })
    };
  }

  const isDuplicated = await checkDuplicated(tripId, userId);

  if (isDuplicated) {
    const responseBody = {
      action: 'create',
      success: false,
      resource: 'reservation',
      message: 'Reservation already exists'
    };
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }

  const result = await createTripReservation(tripId, userId, reservedSeats, routeObj);

  if (result) {
    const responseBody = {
      action: 'create',
      success: true,
      resource: 'reservation',
      resource_id: result.reservation_id
    };
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
  const responseBody = {
    action: 'create',
    success: false,
    resource: 'reservation'
  };
  return {
    statusCode: 409,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
