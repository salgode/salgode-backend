const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
const bcrypt = require('bcryptjs');

async function getUserFromLogin(userEmail) {
  let params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name_from_email,
    ProjectionExpression:
      'user_id, password_hash, car, bearer_token, first_name, last_name, email, phone, user_identifications',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': userEmail
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

exports.handler = async event => {
  let loginEmail = event.email;
  let loginPassword = event.password;
  let userFromLogin = await getUserFromLogin(loginEmail);
  let hashedPassword = userFromLogin.password_hash;
  delete userFromLogin.password_hash;

  if (bcrypt.compareSync(loginPassword, hashedPassword)) {
    return userFromLogin;
  } else {
    return { error: true, message: 'Unauthorized' };
  }
};
