const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function createVehicle(nick, seats, type, color, brand, model, vehicleIdentif) {
  const vehicleId = `veh_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: VehiclesTableName,
    Item: {
      vehicle_id: vehicleId,
      alias: nick,
      vehicle_attributes: {
        seats,
        type,
        color,
        brand,
        model
      },
      vehicle_identifications: vehicleIdentif,
      created_at: timestamp,
      updated_at: timestamp
    }
  };
  await dynamoDB.put(params).promise();
  return [vehicleId, timestamp];
}

async function updateUserVehicle(userId, vehicleId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    UpdateExpression: 'SET vehicles = list_append(vehicles, :vehicle)',
    ExpressionAttributeValues: {
      ':vehicle': [vehicleId]
    },
    ReturnValues: 'NONE'
  };
  const data = await dynamoDB.update(params).promise();
  return data;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const nick = body.nickname;
  const vehicleIdentif = body.vehicle_identification;
  const {
    seats, type, color, brand, model
  } = body;

  const [vehicleId, timestamp] = await createVehicle(
    nick, seats, type, color, brand, model, vehicleIdentif
  );

  if (vehicleId) {
    const result = await updateUserVehicle(userId, vehicleId);
    if (result) {
      return {
        statusCode: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(
          {
            action: 'created',
            success: true,
            resource: 'vehicle',
            resource_id: vehicleId
          }
        )
      };
    }
  }
  return {
    statusCode: 400,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ created: false })
  };
};
