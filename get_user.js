const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

const UsersTableName = process.env.dynamodb_users_table_name;

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, phone, user_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

function parseBody(result) {
  return {
    user_id: result.user_id,
    first_name: result.first_name,
    last_name: result.last_name,
    avatar: result.user_identifications.selfie_image,
    user_verifications: {
      phone: !!result.phone,
      identity:
        !!result.user_identifications.identification.front
        && !!result.user_identifications.identification.back,
      driver_license:
        !!result.user_identifications.driver_license.front
        && !!result.user_identifications.driver_license.back
    }
  };
}

exports.handler = async (event) => {
  const userId = event.pathParameters.user;
  const result = await getUser(userId);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(parseBody(result))
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
