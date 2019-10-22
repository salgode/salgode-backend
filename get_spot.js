const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getSpot(spotID) {
  let params = {
      TableName : process.env.dynamodb_table_name,
      Key: {
          "id": spotID
      },
      ProjectionExpression: "spot_id, address, city, commune, icon, lat, lon, #name, #type",
      ExpressionAttributeNames: {
          "#name": "name",
          "#type": "type"
      }
  };
  let data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  let spotId = event.pathParameters.spot;
  let result = await getSpot(spotId);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  }
  else {
    let responseBody = {
      message: 'Spot does not exist'
    };
    return {
      statusCode: 422,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
};
