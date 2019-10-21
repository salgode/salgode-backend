const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

async function acceptSlot(slotId, slotStatus) {
  let data = await dynamoDB.transactWrite({
    TransactItems: [
        {
            Update: {
                TableName: process.env.dynamodb_table_name_slots,
                Key: {
                    "slot_id": tripId
                },
                UpdateExpression: "set accepted = :slot_status",
                ExpressionAttributeValues: {
                    ":slot_status": slotStatus
                }
            }
        },
        {
            Update: {
                TableName: process.env.dynamodb_table_name_trips,
                Key: {
                    "trip_id": tripId
                },
                UpdateExpression: "set available_seats = available_seats - :requested_seats",
                ExpressionAttributeValues: {
                    ":requested_seats": 1
                }
            }
        }
    ]
  }).promise();
  return data;
}

exports.handler = async (event) => {
  let tripId = event.trip_id;
  let userId = event.user_id;

  await createSlot(tripId, userId);

  let result = {
    created: true
  };

  return result;
};
