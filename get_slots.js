const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getSlots(tripId) {
  let params = {
      TableName: process.env.dynamodb_table_name,
      IndexName: process.env.dynamodb_index_name,
      ScanIndexForward: true,
      ProjectionExpression:"slot_id, created_at, slot_status, user_id",
      KeyConditionExpression: "trip_id = :trip_id",
      ExpressionAttributeValues: {
          ":trip_id": tripId
      }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async (event) => {
  let tripId = event.pathParameters.trip;
  let result = await getSlots(tripId);
  const response = {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin': '*'},
      body: JSON.stringify(result)
  };
  return response;
};
