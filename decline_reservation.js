const aws = require('aws-sdk');
const moment = require('moment');
const { Expo } = require('expo-server-sdk');

const ReceiptsTableName = process.env.dynamodb_receipts_table_name;
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
    body: 'El conductor no puede llevarte 😞',
    data: { action: 'decline', resource: 'reservation' }
  };
  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    return ticket;
  } catch (error) {
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
  if (!expoPushToken) { return false; }
  const result = await sendNotification(expoPushToken);
  return result;
}

async function declineReservation(reservationId) {
  const updatedStatus = 'declined';
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
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

async function saveReceipt(receiptId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const params = {
    TableName: ReceiptsTableName,
    Item: {
      receipt_id: receiptId,
      receipt_type: 'expo_push_notification',
      checked: false,
      created_at: timestamp,
      updated_at: timestamp
    }
  };
  return dynamoDB.put(params).promise();
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

  const tickets = await notifyPassenger(reservationId);
  if (tickets && tickets.length && tickets[0].id) {
    const ticketId = tickets[0].id;
    await saveReceipt(ticketId);
  }

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
