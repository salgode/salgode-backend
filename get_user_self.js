const aws = require('aws-sdk');

const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

async function getImageUrl(imageId) {
  const params = {
    TableName: ImagesTableName,
    Key: {
      image_id: imageId
    },
    ProjectionExpression: 'file_name, folder_name'
  };
  const data = await dynamoDB.get(params).promise();
  const image = data.Item;
  return parseUrl(ImagesBaseUrl, image.folder_name, image.file_name);
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, email, phone, user_identifications, user_verifications, vehicles'
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
      'vehicle_id, alias, vehicle_attributes, vehicle_identifications, vehicle_verifications'
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

    const selfieUrl = result.user_identifications.selfie_image
      ? await getImageUrl(result.user_identifications.selfie_image)
      : null;
    const identFrontUrl = result.user_identifications.identification.front
      ? await getImageUrl(result.user_identifications.identification.front)
      : null;
    const identBackUrl = result.user_identifications.identification.back
      ? await getImageUrl(result.user_identifications.identification.back)
      : null;
    const driverFrontUrl = result.user_identifications.driver_license.front
      ? await getImageUrl(result.user_identifications.driver_license.front)
      : null;
    const driverBackUrl = result.user_identifications.driver_license.back
      ? await getImageUrl(result.user_identifications.driver_license.back)
      : null;

    const response = {
      user_id: result.user_id,
      first_name: result.first_name,
      last_name: result.last_name,
      email: result.email,
      phone: result.phone,
      avatar: selfieUrl,
      user_verifications: {
        email: result.user_verifications.email,
        phone: result.user_verifications.phone,
        identity:
          result.user_verifications.identification.front
          && result.user_verifications.identification.back,
        driver_license:
          result.user_verifications.driver_license.front
          && result.user_verifications.driver_license.back
      },
      user_identifications: {
        selfie: selfieUrl,
        identification: {
          front: identFrontUrl,
          back: identBackUrl
        },
        driver_license: {
          front: driverFrontUrl,
          back: driverBackUrl
        }
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
    statusCode: 403,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Service Unavailable' })
  };
};
