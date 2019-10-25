const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();

function generatePolicy(principalId, effect, userId) {
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: '*'
      }]
    },
    context: {
      user_id: userId
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
  const user = await validateToken(userToken);
  if (user) {
    return generatePolicy('user', 'Allow', user.user_id);
  } else { // eslint-disable-line no-else-return
    return generatePolicy('user', 'Deny', null);
  }
};
