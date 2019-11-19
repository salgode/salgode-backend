const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const UsersIndexName = process.env.dynamodb_users_index_name;
let DevicesTableName = process.env.dynamodb_devices_table_name;
let ImagesTableName = process.env.dynamodb_images_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;
let VehiclesTableName = process.env.dynamodb_vehicles_table_name;

function stagingOverwrite() {
  DevicesTableName = `Dev_${process.env.dynamodb_devices_table_name}`;
  ImagesTableName = `Dev_${process.env.dynamodb_images_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
  VehiclesTableName = `Dev_${process.env.dynamodb_vehicles_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUserFromLogin(userEmail) {
  const params = {
    TableName: UsersTableName,
    IndexName: UsersIndexName,
    ProjectionExpression:
      'user_id, password_hash, vehicles, first_name, last_name, email, phone, user_identifications, user_verifications',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': userEmail }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

async function getVehicle(vehicleId) {
  const params = {
    TableName: VehiclesTableName,
    Key: { vehicle_id: vehicleId },
    ProjectionExpression:
      'vehicle_id, alias, vehicle_attributes, vehicle_identifications, vehicle_verifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getImgUrl(imageId) {
  const params = {
    TableName: ImagesTableName,
    Key: { image_id: imageId },
    ProjectionExpression: 'file_name, folder_name'
  };
  const data = await dynamoDB.get(params).promise();
  const image = data.Item;
  return parseUrl(ImagesBaseUrl, image.folder_name, image.file_name);
}

async function checkDeviceExists(deviceId) {
  const params = {
    TableName: DevicesTableName,
    Key: { device_id: deviceId }
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function updateSession(userId, deviceId, expoPushToken) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const newBearerToken = uuidv4();
  const transactParams = { TransactItems: [] };
  const updateUserParams = {
    TableName: UsersTableName,
    Key: { user_id: userId },
    UpdateExpression: 'set #bt = :newBearerToken, #upd = :now',
    ExpressionAttributeNames: { '#bt': 'bearer_token', '#upd': 'updated_at' },
    ExpressionAttributeValues: {
      ':newBearerToken': newBearerToken,
      ':now': timestamp
    }
  };
  if (deviceId && expoPushToken) {
    updateUserParams.UpdateExpression += ', device_id = :deviceId, #ept = :expoPushToken';
    updateUserParams.ExpressionAttributeNames['#ept'] = 'expo_push_token';
    updateUserParams.ExpressionAttributeValues[':deviceId'] = deviceId;
    updateUserParams.ExpressionAttributeValues[':expoPushToken'] = expoPushToken;
    const deviceAlreadyExists = await checkDeviceExists(deviceId);
    if (deviceAlreadyExists) {
      const device = deviceAlreadyExists;
      if (device.user_id && device.user_id !== userId) {
        transactParams.TransactItems.push({
          Update: {
            TableName: UsersTableName,
            Key: { user_id: device.user_id },
            UpdateExpression: 'set #bt = :forceLogin, device_id = :null, #ept = :null, #upd = :now',
            ExpressionAttributeNames: {
              '#bt': 'bearer_token',
              '#ept': 'expo_push_token',
              '#upd': 'updated_at'
            },
            ExpressionAttributeValues: { ':forceLogin': uuidv4(), ':null': null, ':now': timestamp }
          }
        });
      }
      transactParams.TransactItems.push({
        Update: {
          TableName: DevicesTableName,
          Key: { device_id: deviceId },
          UpdateExpression: 'set user_id = :userId, expo_push_token = :expoPushToken, updated_at = :now',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':expoPushToken': expoPushToken,
            ':now': timestamp
          }
        }
      });
    } else {
      transactParams.TransactItems.push({
        Put: {
          TableName: DevicesTableName,
          Item: {
            device_id: deviceId,
            user_id: userId,
            expo_push_token: expoPushToken,
            created_at: timestamp,
            updated_at: timestamp
          }
        }
      });
    }
  }
  transactParams.TransactItems.push({ Update: updateUserParams });
  await dynamoDB.transactWrite(transactParams).promise();
  return newBearerToken;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const body = JSON.parse(event.body);
  const loginEmail = body.email.toLowerCase();
  const loginPassword = body.password;
  const deviceId = body.device_id;
  const expoPushToken = body.expo_push_token;
  const userFromDb = await getUserFromLogin(loginEmail);

  if (!userFromDb || !bcrypt.compareSync(loginPassword, userFromDb.password_hash)) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }

  const newBearerToken = await updateSession(userFromDb.user_id, deviceId, expoPushToken);

  const userVehicles = await Promise.all(userFromDb.vehicles.map((v) => getVehicle(v)));

  const userIdentifs = userFromDb.user_identifications;
  const [idt, dl] = ['identification', 'driver_license'];
  const selfieUrl = userIdentifs.selfie_image ? await getImgUrl(userIdentifs.selfie_image) : null;
  const identFrontUrl = userIdentifs[idt].front ? await getImgUrl(userIdentifs[idt].front) : null;
  const identBackUrl = userIdentifs[idt].back ? await getImgUrl(userIdentifs[idt].back) : null;
  const driverFrontUrl = userIdentifs[dl].front ? await getImgUrl(userIdentifs[dl].front) : null;
  const driverBackUrl = userIdentifs[dl].back ? await getImgUrl(userIdentifs.back) : null;

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      bearer_token: newBearerToken,
      user_id: userFromDb.user_id,
      first_name: userFromDb.first_name,
      last_name: userFromDb.last_name,
      email: userFromDb.email,
      phone: userFromDb.phone,
      avatar: selfieUrl,
      user_verifications: {
        email: userFromDb.user_verifications.email,
        phone: userFromDb.user_verifications.phone,
        identity:
          userFromDb.user_verifications[idt].front
          && userFromDb.user_verifications[idt].back,
        driver_license:
          userFromDb.user_verifications[dl].front
          && userFromDb.user_verifications[dl].back
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
      vehicles: userVehicles
    })
  };
};
