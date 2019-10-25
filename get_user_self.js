const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  const params = {
    TableName: process.env.dynamodb_table_name,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, email, phone, user_identifications, vehicles'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const result = await getUser(userId);
  if (result) {
    const response = {
      user_id: result.user_id,
      first_name: result.first_name,
      last_name: result.last_name,
      email: result.email,
      phone: result.phone,
      avatar: result.user_identifications.selfie_image,
      user_verifications: {
        phone: !!result.phone,
        identity:
          !!result.user_identifications.identification_image_front
          && !!result.user_identifications.identification_image_back,
        driver_license: !!result.user_identifications.driver_license
      },
      user_identifications: result.user_identifications,
      vehicles: result.vehicles
    };
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(response)
    };
  }
  return {
    statusCode: 503,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ message: 'Service Unavailable' })
  };
};
