const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const EventsTableName = process.env.dynamodb_events_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

const updateableAttrs = [
  'alias',
  'vehicle_attributes',
  'vehicle_identifications'
];

function parseUpdateParams(body, updatedAt) {
  let expression = 'SET ';
  const values = {};
  for (let i = 0; i < updateableAttrs.length; i += 1) {
    if (body[updateableAttrs[i]]) {
      expression += `${updateableAttrs[i]} = :${updateableAttrs[i]}, `;
      values[`:${updateableAttrs[i]}`] = body[updateableAttrs[i]];
    }
  }
  if (Object.keys(values).length) {
    expression += 'updated_at = :updatedAt';
    values[':updatedAt'] = updatedAt;
  } else {
    throw new Error('[BadRequest] No updateable attributes specified');
  }
  return [expression, values];
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

async function updateVehicle(userId, vehicleId, updateParams, rawData) {
  const eventId = `evt_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const [updateExpression, expressionAttributeValues] = parseUpdateParams(
    updateParams,
    timestamp
  );
  try {
    await dynamoDB
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: VehiclesTableName,
              Key: {
                vehicle_id: vehicleId
              },
              UpdateExpression: updateExpression,
              ExpressionAttributeValues: expressionAttributeValues
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
                action: 'update',
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

  const vehicleId = event.pathParameters.vehicle;
  const body = JSON.parse(event.body);

  const vehicle = await getVehicle(vehicleId);
  const updateParams = {
    alias: body.alias || vehicle.alias,
    vehicle_attributes: {
      ...vehicle.vehicle_attributes, ...body.vehicle_attributes
    },
    vehicle_identifications: {
      ...vehicle.vehicle_identifications, ...body.vehicle_identifications
    }
  };
  const result = await updateVehicle(userId, vehicleId, updateParams, body);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(
        {
          action: 'update',
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
      action: 'update',
      success: false,
      resource: 'vehicle',
      message: 'Request contains errors'
    })
  };
};
