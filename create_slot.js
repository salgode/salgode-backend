const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

async function createSlot(tripId, userId) {
  let slotId = 'slo_' + uuidv4();
  let createdAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  try {
    await dynamoDB.transactWrite({
      TransactItems: [
          {
              ConditionCheck: {
                  TableName: process.env.dynamodb_table_name_trips,
                  Key: {
                      "trip_id": tripId
                  },
                  ConditionExpression: "available_seats >= :available_seats",
                  ExpressionAttributeValues: {
                      ":available_seats": 1,
                  }
              }
          },
          {
              Put: {
                  TableName: process.env.dynamodb_table_name_slots,
                  Item: {
                      "slot_id": slotId,
                      "trip_id": tripId,
                      "user_id": userId,
                      "slot_status": "requested",
                      "created_at": createdAt
                  }
              }
          }
      ]
    }).promise();
    return true;
  }
  catch(e) {
    return false;
  }
}

exports.handler = async event => {
  let tripId = event.trip_id;
  let userId = event.user_id;

  let result = {
    created: await createSlot(tripId, userId)
  };

  return result;
};
