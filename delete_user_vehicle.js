const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

let VehiclesTableName = process.env.dynamodb_vehicles_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;

function stagingOverwrite() {
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
  VehiclesTableName = `Dev_${process.env.dynamodb_vehicles_table_name}`;
}

async function getUserVehicle(userId, vehicleId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  if (data && data.Item && data.Item.vehicles) {
    const filteredVehicleArray = data.Item.vehicles.filter((v) => v === vehicleId);
    return filteredVehicleArray.length > 0 ? filteredVehicleArray[0] : null;
  }
  return null;
}

async function deleteUserVehicle(vehicleId) {
  const params = {
    TableName: VehiclesTableName,
    Key: {
      vehicle_id: vehicleId
    }
  };
  const data = await dynamoDB.delete(params).promise();
  return data;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const vehicleId = event.pathParameters.vehicle;
  const userId = event.requestContext.authorizer.user_id;
  const userVehicle = await getUserVehicle(userId, vehicleId);
  if (userVehicle) {
    await deleteUserVehicle(vehicleId);
  }
  const message = {
    action: 'delete', success: true, resource: 'vehicle', resource_id: vehicleId
  };
  const result = {
    body: JSON.stringify(message)
  };

  return result;
};
