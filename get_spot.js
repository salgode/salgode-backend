const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getSpot(spotId) {
  let params = {
    TableName: 'SalgodeSpot',
    ScanIndexForward: true,
    ProjectionExpression:
      '#id, #address, #city, #commune, #icon, #lat, #lon, #name, #type',
    ExpressionAttributeNames: {
      '#id': 'id',
      '#address': 'address',
      '#city': 'city',
      '#commune': 'commune',
      '#icon': 'icon',
      '#lat': 'lat',
      '#lon': 'lon',
      '#name': 'name',
      '#type': 'type'
    },
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': spotId
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async event => {
  let spotId = event.pathParameters.spot;
  let result = await getSpot(spotId);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
  return response;
};
