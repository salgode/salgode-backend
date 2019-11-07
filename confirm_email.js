const aws = require('aws-sdk');
const moment = require('moment');

const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression:
      'email_token'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function confirmEmail(userId) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    UpdateExpression: 'set user_verifications.email = :val, updated_at = :now',
    ExpressionAttributeValues: {
      ':val': true,
      ':now': timestamp
    },
    ReturnValues: 'UPDATED_NEW'
  };
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

exports.handler = async (event) => {
  const userId = event.queryStringParameters.user;
  const emailToken = event.queryStringParameters.token;
  const user = await getUser(userId);

  if (!user || user.email_token !== emailToken) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(
        {
          message: 'Unauthorized'
        }
      )
    };
  }

  await confirmEmail(userId);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(
      {
        message: 'Your email has been confirmed'
      }
    )
  };
};
