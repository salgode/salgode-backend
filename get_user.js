const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
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
    verifications: {
      phone: result.phone.length > 0,
      identity:
        !!(result.user_identifications.identification_image_front.length > 0
          && result.user_identifications.identification_image_back.length > 0),
      driver_license: result.user_identifications.driver_license.length > 0
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
