const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, bearer_token, email, first_name, last_name, phone, user_identifications, vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const userId = event.pathParameters.user;
  const result = await getUser(userId);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  }

  const responseBody = {
    message: 'User does not exist'
  };
  return {
    statusCode: 422,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
