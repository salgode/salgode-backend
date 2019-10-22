const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  let params = {
    TableName: process.env.dynamodb_table_name,
    ScanIndexForward: true,
    ProjectionExpression:
      '#user_id, #email, #first_name, #last_name, #phone, #user_identifications, #car',
    ExpressionAttributeNames: {
      '#user_id': 'user_id',
      '#email': 'email',
      '#first_name': 'first_name',
      '#last_name': 'last_name',
      '#phone': 'phone',
      '#user_identifications': 'user_identifications',
      '#car': 'car'
    },
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': userId
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

exports.handler = async event => {
  let userId = event.pathParameters.id;
  console.log('userId', userId);
  let result = await getUser(userId);
  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
  return response;
};
