const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(bearerToken) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    KeyConditionExpression: 'bearer_token = :bearerToken',
    ProjectionExpression: 'user_id',
    ExpressionAttributeValues: {
      ':bearerToken': bearerToken
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0].user_id;
}

exports.handler = async (event) => {
  const bearerToken = event.headers.Authorization.substring(7);
  const result = await getUser(bearerToken);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: result
    };
  }

  const responseBody = {
    message: 'User does not exist'
  };
  return {
    statusCode: 404,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
