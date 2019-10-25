const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');


const dynamoDB = new aws.DynamoDB.DocumentClient();
const UserTableName = process.env.dynamodb_user_table_name;
const VehiclesTableName = process.env.dynamodb_vehicle_table_name;

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

async function getVehicle(vehicleId) {
  const params = {
    TableName: VehiclesTableName,
    Key: {
      vehicle_id: vehicleId
    }
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  const vehicleId = event.pathParameters.vehicle;
  const user = await getUser(userId);
  let responseBody = [];
  const userDesideredVehicle = user.vehicles.filter((vehicle) => vehicle.vehicle_id == vehicleId);
  if (userDesideredVehicle.length !== 0) {
    const vehicle = await getVehicle(vehicleId);
    responseBody = {
      nickname: userDesideredVehicle[0].nickname,
      seats: userDesideredVehicle[0].seats,
      type: userDesideredVehicle[0].type,
      vehicle_id: vehicleId,
      vehicle_information: {
        vehicle
      }
    };
  }

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
  return response;
};
