const aws = require('aws-sdk');
const moment = require('moment');

let ReservationsTableName = process.env.dynamodb_reservations_table_name;

function stagingOverwrite() {
  ReservationsTableName = `Dev_${process.env.dynamodb_reservations_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function cancelReservation(reservationId, userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const params = {
    TableName: ReservationsTableName,
    Key: {
      reservation_id: reservationId
    },
    UpdateExpression: 'set reservation_status = :new_status, updated_at = :now',
    ConditionExpression:
      'reservation_status = :expectedStatus and passenger_id = :self',
    ExpressionAttributeValues: {
      ':new_status': 'canceled',
      ':now': timestamp,
      ':self': userId,
      ':expectedStatus': 'pending'
    }
  };
  const data = await dynamoDB.update(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const reservationId = event.pathParameters.reservation;

  try {
    await cancelReservation(reservationId, userId);
  } catch (err) {
    return {
      statusCode: 409,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'cancel',
        success: false,
        resource: 'reservation',
        message: 'Conflict'
      })
    };
  }
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'cancel',
      success: true,
      resource: 'reservation',
      resource_id: reservationId
    })
  };
};
