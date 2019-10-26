const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function createUserVehicle(userId, nick, seats, type, color, brand, model, vehicleIdentif) {
  const vehicleId = `veh_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const newUserVehicle = {
    vehicle_id: vehicleId,
    nickname: nick
  };
  const newVehicle = {
    vehicle_id: vehicleId,
    seats,
    type,
    color,
    brand,
    model,
    vehicle_identifications: {
      type: vehicleIdentif.type,
      identification: vehicleIdentif.identification,
      country: vehicleIdentif.country,
      verified: vehicleIdentif.verified
    },
    created_at: timestamp,
    updated_at: timestamp
  };
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: UsersTableName,
              Key: {
                user_id: userId
              },
              UpdateExpression: 'set vehicles = list_append(vehicles, :newUserVehicle), updated_at = :now',
              ExpressionAttributeValues: {
                ':newUserVehicle': [newUserVehicle],
                ':now': timestamp
              }
            }
          },
          {
            Put: {
              TableName: VehiclesTableName,
              Item: {
                ...newVehicle
              }
            }
          }
        ]
      })
      .promise();
    return newVehicle;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const body = JSON.parse(event.body);
  const nick = body.nickname;
  const vehicleIdentif = body.vehicle_identifications;
  const {
    seats, type, color, brand, model
  } = body;


  const result = await createUserVehicle(
    userId, nick, seats, type, color, brand, model, vehicleIdentif
  );

  if (result) {
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ created: true })
    };
  }
  return {
    statusCode: 400,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ created: false })
  };
};
