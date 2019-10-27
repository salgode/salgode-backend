const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getTripsByPoint(tripPoint) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    ScanIndexForward: true,
    ProjectionExpression: 'available_seats, driver_id, etd, route_points, trip_id, trip_status',
    KeyConditionExpression: 'trip_status = :open',
    FilterExpression: 'contains (#route_points, :trip_point)',
    ExpressionAttributeNames: {
      '#route_points': 'route_points'
    },
    ExpressionAttributeValues: {
      ':open': 'open',
      ':trip_point': tripPoint
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async (event) => {
  const tripPoint = event.pathParameters.place;
  const result = await getTripsByPoint(tripPoint);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
  return response;
};
