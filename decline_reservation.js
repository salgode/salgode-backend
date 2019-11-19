const aws = require('aws-sdk');
const moment = require('moment');
const { Expo } = require('expo-server-sdk');

let ReservationsTableName = process.env.dynamodb_reservations_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;

function stagingOverwrite() {
  ReservationsTableName = `Dev_${process.env.dynamodb_reservations_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();
const expo = new Expo();

async function sendNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    body: 'El conductor no puede llevarte :(',
    data: { action: 'decline', resource: 'trip' }
  };
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    return ticketChunk;
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    return false;
  }
}

async function notifyPassenger(reservationId) {
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
  const result = await sendNotification(expoPushToken);
  return result;
}

async function declineReservation(reservationId) {
  const updatedStatus = 'declined';
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  try {
    const params = {
      TableName: ReservationsTableName,
      Key: {
        reservation_id: reservationId
      },
      UpdateExpression: 'set reservation_status = :new_status, updated_at = :now',
      ExpressionAttributeValues: {
        ':new_status': updatedStatus,
        ':now': timestamp
      }
    };
    await dynamoDB.update(params).promise();
    return { reservation_id: reservationId, reservation_status: updatedStatus };
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const reservationId = event.pathParameters.reservation;
  const result = await declineReservation(reservationId);

  if (!result) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'decline',
        success: false,
        resource: 'reservation',
        message: 'Wrong or missing parameters'
      })
    };
  }

  await notifyPassenger(reservationId);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'decline',
      success: true,
      resource: 'reservation',
      resource_id: reservationId
    })
  };
};
