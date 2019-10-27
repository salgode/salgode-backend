const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const moment = require('moment');

const updateableAttrs = [
  'alias',
  'seats',
  'vehicle_attributes'
];

const VehicleTableName = process.env.dynamodb_vehicles_table_name;

function parseUpdateParams(body, updateableAttrs, updatedAt) {
  let expression = 'SET ';
  const values = {};
  for (let i = 0; i < updateableAttrs.length; i++) {
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
    updateableAttrs,
    updatedAt
  );

  const params = {
    TableName: VehicleTableName,
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

exports.handler = async (event) => {
  const vehicleId = event.pathParameters.vehicle;
  const body = JSON.parse(event.body);
  await updateUserVehicle(vehicleId, body);

  const message = {
    action: 'updated', success: true, resource: 'vehicle', resource_id: vehicleId
  };
  const result = {
    body: JSON.stringify(message)
  };

  return result;
};
