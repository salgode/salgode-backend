const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

async function createSlot(tripId, userId) {
  let slotId = 'slo_' + uuidv4();
  let createdAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  let data = await dynamoDB
    .transactWrite({
      TransactItems: [
        {
          Put: {
            TableName: process.env.dynamodb_table_name_slots,
            Item: {
              slot_id: slotId,
              trip_id: tripId,
              user_id: userId,
              slot_status: 'requested',
              created_at: createdAt
            }
          }
        },
        {
          Update: {
            TableName: process.env.dynamodb_table_name_trips,
            Key: {
              trip_id: tripId
            },
            UpdateExpression:
              'set available_seats = available_seats - :requested_seats',
            ExpressionAttributeValues: {
              ':requested_seats': 1
            }
          }
        }
      ]
    })
    .promise();
  return data;
}

exports.handler = async event => {
  let tripId = event.trip_id;
  let userId = event.user_id;

  await createSlot(tripId, userId);

  let result = {
    created: true
  };

  return result;
};
