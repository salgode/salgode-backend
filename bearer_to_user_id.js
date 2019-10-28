const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

exports.bearerToUserId = async function getUser(bearerToken) {
  const params = {
    TableName: 'Users',
    IndexName: 'bearer_token-index',
    KeyConditionExpression: 'bearer_token = :bearerToken',
    ProjectionExpression: 'user_id',
    ExpressionAttributeValues: {
      ':bearerToken': bearerToken
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0].user_id;
};
