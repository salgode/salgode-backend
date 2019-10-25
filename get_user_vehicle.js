const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const UserTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

async function getUserVehicle(userId, vehicleId) {
  const params = {
    TableName: UserTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  if (data && data.Item && data.Item.vehicles) {
    const filteredVehicleArray = data.Item.vehicles.filter((v) => v.vehicle_id === vehicleId);
    return filteredVehicleArray.length > 0 ? filteredVehicleArray[0] : null;
  }
  return null;
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
  const userVehicle = await getUserVehicle(userId, vehicleId);

  if (userVehicle) {
    const theVehicle = await getVehicle(vehicleId);
    const responseBody = {
      vehicle_id: theVehicle.vehicle_id,
      nickname: userVehicle.nickname,
      seats: theVehicle.seats,
      type: theVehicle.type,
      color: theVehicle.color,
      brand: theVehicle.brand,
      model: theVehicle.model,
      vehicle_identifications: theVehicle.vehicle_identifications
    };
    const response = {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
    return response;
  }
  const response = {
    statusCode: 403,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Forbidden access' })
  };
  return response;
};
