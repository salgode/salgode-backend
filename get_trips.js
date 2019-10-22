const { parallelScan } = require('@shelf/dynamodb-parallel-scan');

async function getTrips() {
  let params = {
    TableName: process.env.dynamodb_table_name,
    ProjectionExpression: 'available_seats, driver_id, etd, route_points, trip_id, trip_status'
  };
  let data = await parallelScan(params, { concurrency: 1000 });
  return data;
}

exports.handler = async event => {
  let allTrips = await getTrips();
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(allTrips)
  };
  return response;
};
