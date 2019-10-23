const { parallelScan } = require('@shelf/dynamodb-parallel-scan');

async function getTrips(driverId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    ProjectionExpression: 'available_seats, driver_id, etd, route_points, trip_id, trip_status',
    FilterExpression: 'driver_id = :driver_id and trip_status in (:status_1, :status_2)',
    ExpressionAttributeValues: {
      ':driver_id': driverId,
      ':status_1': 'open',
      ':status_2': 'in_progress'
    }
  };
  const data = await parallelScan(params, { concurrency: 1000 });
  return data;
}

exports.handler = async (event) => {
  const driverId = event.pathParameters.user;
  const result = await getTrips(driverId);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
  return response;
};
