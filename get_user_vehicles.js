const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');


const dynamoDB = new aws.DynamoDB.DocumentClient();
const UserTableName = process.env.dynamodb_user_table_name;
const VehiclesTableName = process.env.dynamodb_vehicle_table_name;

function mapVehicleKeys(vehicleIds) {
  return vehicleIds.map((vehicleId) => ({
    vehicle_id: vehicleId
  }));
}

async function getUser(userId) {
  const params = {
    TableName: UserTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, phone, user_identifications, vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getVehicleByVehicleIds(vehiclesIds) {
  const params = {
    RequestItems: {
      [VehiclesTableName]: {
        Keys: mapVehicleKeys(vehiclesIds),
        AttributesToGet: [
          'color',
          'identification',
          'type'
        ],
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[VehiclesTableName];
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const user = await getUser(userId);
  const vehiclesIds = user.vehicles.map((vehicle) => vehicle.vehicle_id);
  let responseBody = [];
  if (vehiclesIds.length !== 0) {
    const vehiclesInformation = await getVehicleByVehicleIds(vehiclesIds);
    const vehicles = user.vehicles.map((vehicle, idx) => ({
      nickname: vehicle.nickname,
      seats: vehicle.seats,
      type: vehicle.type,
      vehicle_id: vehicle.vehicle_id,
      vehicle_information: vehiclesInformation[idx]
    }));
    responseBody = { vehicles };
  }

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
  return response;
};
