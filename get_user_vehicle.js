const aws = require('aws-sdk');

let UsersTableName = process.env.dynamodb_users_table_name;
let VehiclesTableName = process.env.dynamodb_vehicles_table_name;

function stagingOverwrite() {
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
  VehiclesTableName = `Dev_${process.env.dynamodb_vehicles_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getVehicle(vehicleId) {
  const params = {
    TableName: VehiclesTableName,
    Key: {
      vehicle_id: vehicleId
    },
    ProjectionExpression:
      'vehicle_id, vehicle_attributes, vehicle_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const vehicleId = event.pathParameters.vehicle;

  const user = await getUser(userId);
  const vehicleInUser = user.vehicles.filter((vId) => vId === vehicleId);
  if (vehicleInUser) {
    const vehicle = await getVehicle(vehicleId);
    const response = {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(vehicle)
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
