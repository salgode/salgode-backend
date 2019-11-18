const aws = require('aws-sdk');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

let DevicesTableName = process.env.dynamodb_devices_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;

function stagingOverwrite() {
  DevicesTableName = `Dev_${process.env.dynamodb_devices_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getDeviceId(userId) {
  const params = {
    TableName: UsersTableName,
    Key: { user_id: userId },
    ProjectionExpression:
      'device_id'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item.device_id;
}

async function updateSession(userId, deviceId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const params = {
    TransactItems: [
      {
        Update: {
          TableName: UsersTableName,
          Key: { user_id: userId },
          UpdateExpression: 'set #bt = :forceLogin, device_id = :null, #ept = :null, #upd = :now',
          ExpressionAttributeNames: { '#bt': 'bearer_token', '#ept': 'expo_push_token', '#upd': 'updated_at' },
          ExpressionAttributeValues: {
            ':forceLogin': uuidv4(),
            ':null': null,
            ':now': timestamp
          }
        }
      },
      {
        Update: {
          TableName: DevicesTableName,
          Key: { device_id: deviceId },
          UpdateExpression: 'set user_id = :null, expo_push_token = :null, updated_at = :now',
          ExpressionAttributeValues: {
            ':null': null,
            ':now': timestamp
          }
        }
      }
    ]
  };
  return dynamoDB.transactWrite(params).promise();
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const deviceId = await getDeviceId(userId);

  await updateSession(userId, deviceId);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'logout',
      success: true,
      resource: 'user',
      resource_id: userId
    })
  };
};
