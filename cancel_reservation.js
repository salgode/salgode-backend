const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function cancelReservation(reservationId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    Key: {
      reservation_id: reservationId
    },
    UpdateExpression: 'set reservation_status = :new_status',
    ExpressionAttributeValues: {
      ':new_status': 'canceled'
    }
  };
  const data = await dynamoDB.update(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const reservationId = event.pathParameters.reservation;
  await cancelReservation(reservationId);
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
