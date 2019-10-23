const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

async function createSlot(tripId, userId, spotId) {
  const slotId = `slo_${uuidv4()}`;
  const createdAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
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
              ConditionExpression: 'available_seats >= :available_seats',
              ExpressionAttributeValues: {
                ':available_seats': 1
              }
            }
          },
          {
            Put: {
              TableName: process.env.dynamodb_slots_table_name,
              Item: {
                slot_id: slotId,
                trip_id: tripId,
                user_id: userId,
                spot_id: spotId,
                slot_status: 'requested',
                created_at: createdAt
              }
            }
          }
        ]
      })
      .promise();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const tripId = event.pathParameters.trip;
  const userId = body.user_id;
  const spotId = body.spot_id;

  const result = await createSlot(tripId, userId, spotId);

  if (result) {
    return {
      statusCode: 202,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ created: true })
    };
  }
  return {
    statusCode: 409,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ created: false })
  };
};
