const aws = require('aws-sdk');

const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
let ImagesTableName = process.env.dynamodb_images_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;
let VehiclesTableName = process.env.dynamodb_vehicles_table_name;

function stagingOverwrite() {
  ImagesTableName = `Dev_${process.env.dynamodb_images_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
  VehiclesTableName = `Dev_${process.env.dynamodb_vehicles_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

async function getImgUrl(imageId) {
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
    }
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
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;

  const user = await getUser(userId);

  if (!user) {
    return {
      statusCode: 403,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Forbidden' })
    };
  }

  const myVehicles = await Promise.all(user.vehicles.map((v) => getVehicle(v)));

  const userIdentifs = user.user_identifications;
  const [idt, dl] = ['identification', 'driver_license'];
  const selfieUrl = userIdentifs.selfie_image ? await getImgUrl(userIdentifs.selfie_image) : null;
  const identFrontUrl = userIdentifs[idt].front ? await getImgUrl(userIdentifs[idt].front) : null;
  const identBackUrl = userIdentifs[idt].back ? await getImgUrl(userIdentifs[idt].back) : null;
  const driverFrontUrl = userIdentifs[dl].front ? await getImgUrl(userIdentifs[dl].front) : null;
  const driverBackUrl = userIdentifs[dl].back ? await getImgUrl(userIdentifs[dl].back) : null;

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      avatar: selfieUrl,
      user_verifications: {
        email: user.user_verifications.email,
        phone: user.user_verifications.phone,
        identity:
            user.user_verifications.identification.front
            && user.user_verifications.identification.back,
        driver_license:
            user.user_verifications.driver_license.front
            && user.user_verifications.driver_license.back
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
    })
  };
};
