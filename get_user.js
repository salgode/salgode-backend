const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getUser(userId) {
  let params = {
      TableName : process.env.dynamodb_table_name,
      Key: {
          "user_id": userId
      },
      ProjectionExpression: "user_id, email, first_name, last_name, phone, user_identifications, car"
  };
  let data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async event => {
  let userId = event.pathParameters.id;
  let result = await getUser(userId);
  if (result) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  }
  else {
    let responseBody = {
      message: 'User does not exist'
    };
    return {
      statusCode: 422,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  }
};
