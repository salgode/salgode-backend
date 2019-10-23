const { parallelScan } = require('@shelf/dynamodb-parallel-scan');

async function getSpots() {
  const params = {
    TableName: process.env.dynamodb_table_name,
    ProjectionExpression: '#id, #name, #address, #city',
    ExpressionAttributeNames: {
      '#id': 'id',
      '#name': 'name',
      '#address': 'address',
      '#city': 'city'
    }
  };
  const data = await parallelScan(params, { concurrency: 1000 });
  return data;
}

exports.handler = async (event) => {
  const query = await getSpots();
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(query)
  };
  return response;
};
