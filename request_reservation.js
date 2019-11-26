const aws = require('aws-sdk');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const { Expo } = require('expo-server-sdk');

const ReceiptsTableName = process.env.dynamodb_receipts_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
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
    body: 'Tienes una nueva solicitud de viaje! 🎉',
    data: { action: 'request', resource: 'trip', resource_id: tripId }
  };
  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    return ticket;
  } catch (error) {
    return false;
  }
}

async function notifyDriver(tripId) {
  const tripData = await dynamoDB.get({
    TableName: TripsTableName,
    Key: { trip_id: tripId },
    ProjectionExpression: 'driver_id'
  }).promise();
  const driverId = tripData.Item.driver_id;
  const driverData = await dynamoDB.get({
    TableName: UsersTableName,
    Key: { user_id: driverId },
    ProjectionExpression: 'expo_push_token'
  }).promise();
  const expoPushToken = driverData.Item.expo_push_token;
  if (!expoPushToken) { return false; }
  const ticket = await sendNotification(expoPushToken, tripId);
  return ticket;
}

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
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            ConditionCheck: {
              TableName: TripsTableName,
              Key: { trip_id: tripId },
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
    return reservationId;
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

  const reservationId = await createTripReservation(tripId, userId, reservedSeats, routeObj);

  if (!reservationId) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'reservation',
        message: 'Wrong or missing parameters'
      })
    };
  }

  const tickets = await notifyDriver(tripId);
  if (tickets && tickets.length && tickets[0].id) {
    const ticketId = tickets[0].id;
    await saveReceipt(ticketId);
  }

  return {
    statusCode: 201,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'create',
      success: true,
      resource: 'reservation',
      resource_id: reservationId
    })
  };
};
