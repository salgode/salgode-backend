const aws = require('aws-sdk');

const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function mapVehicleKeys(vehicleIds) {
  return vehicleIds.map((vehicleId) => ({
    vehicle_id: vehicleId
  }));
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, phone, user_identifications, vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getVehicleByIds(vehiclesIds) {
  const params = {
    RequestItems: {
      [VehiclesTableName]: {
        Keys: mapVehicleKeys(vehiclesIds),
        ProjectionExpression:
          'vehicle_id, alias, vehicle_attributes, vehicle_identifications',
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[VehiclesTableName];
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userId = event.requestContext.authorizer.user_id;
  const user = await getUser(userId);

  const vehiclesRaw = await getVehicleByIds(user.vehicles);
  const vehicles = vehiclesRaw.map((v) => ({
    vehicle_id: v.vehicle_id,
    alias: v.alias,
    nickname: v.alias,
    nickname_deprecation: 'Use alias instead',
    type: v.vehicle_attributes.type,
    type_deprecation: 'Use vehicle_attributes.type instead',
    seats: v.vehicle_attributes.seats,
    seats_deprecation: 'Use vehicle_attributes.seats instead',
    vehicle_attributes: v.vehicle_attributes,
    vehicle_identifications: v.vehicle_identifications
  }));
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ vehicles })
  };
  return response;
};
