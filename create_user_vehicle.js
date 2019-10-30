const aws = require('aws-sdk');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const EventsTableName = process.env.dynamodb_events_table_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

async function createVehicle(userId, alias, vehicleAttrs, vehicleIdentif, rawData) {
  const vehicleId = `veh_${uuidv4()}`;
  const eventId = `evt_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: UsersTableName,
              Key: {
                user_id: userId
              },
              UpdateExpression: 'set vehicles = list_append(vehicles, :vehicleId), updated_at = :now',
              ExpressionAttributeValues: {
                ':vehicleId': [vehicleId],
                ':now': timestamp
              }
            }
          },
          {
            Put: {
              TableName: VehiclesTableName,
              Item: {
                vehicle_id: vehicleId,
                alias,
                vehicle_attributes: vehicleAttrs,
                vehicle_verifications: {
                  identification: false
                },
                vehicle_identifications: vehicleIdentif,
                created_at: timestamp,
                updated_at: timestamp
              }
            }
          },
          {
            Put: {
              TableName: EventsTableName,
              Item: {
                event_id: eventId,
                user_id: userId,
                resource_id: vehicleId,
                resource: 'vehicle',
                action: 'create',
                event_data: rawData,
                created_at: timestamp
              }
            }
          }
        ]
      })
      .promise();
    return vehicleId;
  } catch (e) {
    return false;
  }
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const body = JSON.parse(event.body);
  const { alias } = body;
  const vehicleAttrs = body.vehicle_attributes;
  const vehicleIdentif = body.vehicle_identifications;

  if (!vehicleAttrs || !vehicleIdentif || isEmpty(vehicleAttrs) || isEmpty(vehicleIdentif)) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        action: 'create',
        success: false,
        resource: 'vehicle',
        message: 'Missing attributes or identifications'
      })
    };
  }

  const vehicleId = await createVehicle(
    userId, alias, vehicleAttrs, vehicleIdentif, body
  );

  if (vehicleId) {
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(
        {
          action: 'create',
          success: true,
          resource: 'vehicle',
          resource_id: vehicleId
        }
      )
    };
  }
  return {
    statusCode: 400,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'create',
      success: false,
      resource: 'vehicle',
      message: 'Request contains errors'
    })
  };
};
