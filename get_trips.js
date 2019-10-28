const { parallelScan } = require('@shelf/dynamodb-parallel-scan');

async function getTrips() {
  const params = {
    TableName: process.env.dynamodb_table_name,
    ProjectionExpression: 'available_seats, driver_id, etd, route_points, trip_id, trip_status',
    FilterExpression: 'trip_status in (:open, :in_progress)',
    ExpressionAttributeValues: {
      ':open': 'open',
      ':in_progress': 'in_progress'
    }
  };
  const data = await parallelScan(params, { concurrency: 1000 });
  return data;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const allTrips = await getTrips();
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(allTrips)
  };
  return response;
};
