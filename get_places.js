const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getPlaces() {
  const params = {
    TableName: process.env.dynamodb_places_table_name,
    ProjectionExpression: 'place_id, place_name, lat, lon, address, locality, city'
  };
  const data = await dynamoDB.scan(params).promise();
  return data.Items;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const places = await getPlaces();
  const responseBody = places.map((p) => ({
    place_id: p.place_id,
    place_name: p.place_name,
    lat: p.lat.toString(10),
    lon: p.lon.toString(10),
    id: p.place_id,
    id_deprecation: 'Use place_id instead',
    name: p.place_name,
    name_deprecation: 'Use place_name instead',
    address: p.address,
    locality: p.locality,
    city: p.city
  }));
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
  return response;
};
