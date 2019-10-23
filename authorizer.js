const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

function generatePolicy(principalId, effect, resource) {
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    }
  };
  return policy;
}

async function validateToken(userToken) {
  const token = userToken.split('Bearer ')[1];
  const params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    KeyConditionExpression: '#token = :token',
    ExpressionAttributeNames: {
      '#token': 'bearer_token'
    },
    ExpressionAttributeValues: {
      ':token': token
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items[0];
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  const userToken = event.authorizationToken;
  const arn = event.methodArn;
  const user = await validateToken(userToken);
  if (user) {
    return generatePolicy('user', 'Allow', arn);
  } else { // eslint-disable-line no-else-return
    return generatePolicy('user', 'Deny', arn);
  }
};
