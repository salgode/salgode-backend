const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getPlaces() {
  const params = {
    TableName: process.env.dynamodb_places_table_name,
    ProjectionExpression: '#place_id, #name, #address, #commune, #city, #type, #lat, #lon',
    ExpressionAttributeNames: {
      '#place_id': 'place_id',
      '#name': 'name',
      '#address': 'address',
      '#commune': 'commune',
      '#city': 'city',
      '#type': 'type',
      '#lat': 'lat',
      '#lon': 'lon'
    }
  };
  const data = await dynamoDB.scan(params).promise();
  return data.Items;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const places = await getPlaces();
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(places)
  };
  return response;
};
