const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getTripFromSlot(slotId) {
  let params = {
    TableName: process.env.dynamodb_table_name_slots,
    Key: {
      slot_id: slotId
    },
    ProjectionExpression: 'trip_id'
  };
  let data = await dynamoDB.get(params).promise();
  return data.Item.trip_id;
}

async function acceptSlot(tripId, slotId, slotStatus) {
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: process.env.dynamodb_table_name_trips,
              Key: {
                trip_id: tripId
              },
              ConditionExpression: 'available_seats >= :available_seats',
              UpdateExpression:
                'set available_seats = available_seats - :requested_seats',
              ExpressionAttributeValues: {
                ':available_seats': 1,
                ':requested_seats': 1
              }
            }
          },
          {
            Update: {
              TableName: process.env.dynamodb_table_name_slots,
              Key: {
                slot_id: slotId
              },
              UpdateExpression: 'set slot_status = :slot_status',
              ExpressionAttributeValues: {
                ':slot_status': slotStatus
              }
            }
          }
        ]
      })
      .promise();
    return true;
  } catch (e) {
    return false;
  }
}

exports.handler = async event => {
  let slotId = event.slot_id;
  let slotStatus = event.slot_status;

  let tripId = await getTripFromSlot(slotId);

  let result = {
    accepted: await acceptSlot(tripId, slotId, slotStatus)
  };

  return result;
};
