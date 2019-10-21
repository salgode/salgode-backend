const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getSlots(userId) {
  let params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    ScanIndexForward: true,
    ProjectionExpression:
      '#id, #name, #lastName, #selfieLink, #driverLicenseLink, #dniFrontLink, #dniBackLink, #car, #phone',
    ExpressionAttributeNames: {
      '#id': 'id',
      '#name': 'name',
      '#lastName': 'lastName',
      '#selfieLink': 'selfieLink',
      '#driverLicenseLink': 'driverLicenseLink',
      '#dniFrontLink': 'dniFrontLink',
      '#dniBackLink': 'dniBackLink',
      '#car': 'car',
      '#phone': 'phone'
    },
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': userId
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items;
}

exports.handler = async event => {
  let userId = event.pathParameters.id;
  let result = await getSlots(userId);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
  return response;
};
