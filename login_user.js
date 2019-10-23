const aws = require('aws-sdk');
const bcrypt = require('bcryptjs');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUserFromLogin(userEmail) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    ProjectionExpression:
      'user_id, password_hash, vehicle, bearer_token, first_name, last_name, email, phone, user_identifications',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': userEmail
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const loginEmail = body.email;
  const loginPassword = body.password;
  const userFromLogin = await getUserFromLogin(loginEmail);
  const hashedPassword = userFromLogin.password_hash;
  delete userFromLogin.password_hash;

  if (bcrypt.compareSync(loginPassword, hashedPassword)) {
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(userFromLogin)
    };
  }
  const responseBody = {
    message: 'Unauthorized'
  };
  return {
    statusCode: 401,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseBody)
  };
};
