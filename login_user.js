const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const bcrypt = require('bcryptjs');

async function getUserFromLogin(userEmail) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name_from_email,
    ProjectionExpression:
      'user_id, password_hash, car, bearer_token, first_name, last_name, email, phone, user_identifications',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': userEmail
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

exports.handler = async (event) => {
  const loginEmail = event.email;
  const loginPassword = event.password;
  const userFromLogin = await getUserFromLogin(loginEmail);
  const hashedPassword = userFromLogin.password_hash;
  delete userFromLogin.password_hash;

  if (bcrypt.compareSync(loginPassword, hashedPassword)) {
    return userFromLogin;
  }
  return { error: true, message: 'Unauthorized' };
};
