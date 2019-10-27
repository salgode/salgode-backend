const aws = require('aws-sdk');

const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, email, phone, user_identifications, vehicles'
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
      'vehicle_id, alias, vehicle_attributes, vehicle_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;

  const result = await getUser(userId);
  if (result) {
    const myVehiclesRaw = await Promise.all(result.vehicles.map((v) => getVehicle(v)));
    const myVehicles = myVehiclesRaw.map(
      (v) => ({
        vehicle_id: v.vehicle_id,
        nickname: v.alias,
        nickname_deprecation: 'Use alias instead',
        alias: v.alias
      })
    );
    const response = {
      user_id: result.user_id,
      first_name: result.first_name,
      last_name: result.last_name,
      email: result.email,
      phone: result.phone,
      avatar: result.user_identifications.selfie_image,
      user_verifications: {
        phone: !!result.phone,
        identity:
          !!result.user_identifications.identification.front
          && !!result.user_identifications.identification.back,
        driver_license:
          !!result.user_identifications.driver_license.front
          && !!result.user_identifications.driver_license.back
      },
      user_identifications: {
        selfie: result.user_identifications.selfie_image,
        identification: result.user_identifications.identification,
        driver_license: result.user_identifications.driver_license
      },
      vehicles: myVehicles
    };
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(response)
    };
  }
  return {
    statusCode: 503,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Service Unavailable' })
  };
};
