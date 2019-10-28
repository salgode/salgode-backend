const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

const VehicleTableName = process.env.dynamodb_vehicles_table_name;
const UserTableName = process.env.dynamodb_users_table_name;

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
    const filteredVehicleArray = data.Item.vehicles.filter((v) => v === vehicleId);
    return filteredVehicleArray.length > 0 ? filteredVehicleArray[0] : null;
  }
  return null;
}

async function deleteUserVehicle(vehicleId) {
  const params = {
    TableName: VehicleTableName,
    Key: {
      vehicle_id: vehicleId
    }
  };
  const data = await dynamoDB.delete(params).promise();
  return data;
}

exports.handler = async (event) => {
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
