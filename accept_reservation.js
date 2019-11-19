const aws = require('aws-sdk');
const moment = require('moment');
const { Expo } = require('expo-server-sdk');

let ReservationsTableName = process.env.dynamodb_reservations_table_name;
let TripsTableName = process.env.dynamodb_trips_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;

function stagingOverwrite() {
  ReservationsTableName = `Dev_${process.env.dynamodb_reservations_table_name}`;
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();
const expo = new Expo();

async function sendNotification(expoPushToken, tripId) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    body: 'Tu solicitud ha sido aceptada! :)',
    data: { action: 'accept', resource: 'trip', resource_id: tripId }
  };
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    return ticketChunk;
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    return false;
  }
}

async function notifyPassenger(reservationId, tripId) {
  const reservationData = await dynamoDB.get({
    TableName: ReservationsTableName,
    Key: { reservation_id: reservationId },
    ProjectionExpression: 'passenger_id'
  }).promise();
  const passengerId = reservationData.Item.passenger_id;
  const passengerData = await dynamoDB.get({
    TableName: UsersTableName,
    Key: { user_id: passengerId },
    ProjectionExpression: 'expo_push_token'
  }).promise();
  const expoPushToken = passengerData.Item.expo_push_token;
  const result = await sendNotification(expoPushToken, tripId);
  return result;
}

async function getReservedSeats(reservationId) {
  const params = {
    TableName: ReservationsTableName,
    Key: { reservation_id: reservationId },
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
              Key: { reservation_id: reservationId },
              UpdateExpression: 'set reservation_status = :new_status, updated_at = :now',
              ExpressionAttributeValues: { ':new_status': updatedStatus, ':now': timestamp }
            }
          },
          {
            Update: {
              TableName: TripsTableName,
              Key: { trip_id: tripId },
              ConditionExpression: 'available_seats >= :reserved_seats',
              UpdateExpression:
                'set available_seats = available_seats - :reserved_seats, updated_at = :now',
              ExpressionAttributeValues: { ':reserved_seats': reservedSeats, ':now': timestamp }
            }
          }
        ]
      })
      .promise();
    return reservationId;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const tripId = event.pathParameters.trip;
  const reservationId = event.pathParameters.reservation;
  const reservedSeats = await getReservedSeats(reservationId);

  const result = await acceptReservation(reservedSeats, reservationId, tripId);

  if (!result) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'accept',
        success: false,
        resource: 'reservation',
        message: 'Wrong or missing parameters'
      })
    };
  }

  await notifyPassenger(reservationId, tripId);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'accept',
      success: true,
      resource: 'reservation',
      resource_id: reservationId
    })
  };
};
