const aws = require('aws-sdk');
const moment = require('moment');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function declineReservation(reservationId) {
  const updatedStatus = 'declined';
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  try {
    const params = {
      TableName: process.env.dynamodb_table_name,
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
  const reservationId = event.pathParameters.reservation;
  const result = await declineReservation(reservationId);

  if (result) {
    const responseBody = {
      action: 'decline',
      success: true,
      resource: 'reservation',
      resource_id: reservationId
    };
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
  return {
    statusCode: 409,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ declined: false })
  };
};
