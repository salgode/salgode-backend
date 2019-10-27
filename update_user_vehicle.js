const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const EventsTableName = process.env.dynamodb_events_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

const updateableAttrs = [
  'alias',
  'vehicle_attributes',
  'vehicle_identifications'
];

async function createEvent(userId, resourceId, resource, action, data) {
  const eventId = `evt_${uuidv4()}`;
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const params = {
    TableName: EventsTableName,
    Item: {
      event_id: eventId,
      user_id: userId,
      resource_id: resourceId,
      resource,
      action,
      event_data: data,
      created_at: timestamp
    }
  };
  await dynamoDB.put(params).promise();
}

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
    expression += 'updatedAt = :updatedAt';
    values[':updatedAt'] = updatedAt;
  } else {
    throw new Error('[BadRequest] No updateable attributes specified');
  }
  return [expression, values];
}

async function updateUserVehicle(vehicleId, body) {
  const updatedAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
  const [updateExpression, expressionAttributeValues] = parseUpdateParams(
    body,
    updatedAt
  );

  const params = {
    TableName: VehiclesTableName,
    Key: {
      vehicle_id: vehicleId
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'NONE'
  };
  const data = await dynamoDB.update(params).promise();
  return data;
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
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const vehicleId = event.pathParameters.vehicle;
  let body = JSON.parse(event.body);

  const vehicle = await getVehicle(vehicleId);
  body = {
    alias: body.alias || vehicle.alias,
    vehicle_attributes: {
      ...vehicle.vehicle_attributes, ...body.vehicle_attributes
    },
    vehicle_identifications: {
      ...vehicle.vehicle_identifications, ...body.vehicle_identifications
    }
  };
  await updateUserVehicle(vehicleId, body);
  await createEvent(userId, vehicleId, 'user', 'update', body);

  const message = {
    action: 'update',
    success: true,
    resource: 'vehicle',
    resource_id: vehicleId
  };
  const result = {
    body: JSON.stringify(message)
  };

  return result;
};
