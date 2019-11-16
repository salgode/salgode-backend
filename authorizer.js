const aws = require('aws-sdk');

const UsersTableName = process.env.dynamodb_table_name;
const UsersIndexName = process.env.dynamodb_index_name;

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
    TableName: UsersTableName,
    IndexName: UsersIndexName,
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

async function validateTokenStaging(userToken) {
  const token = userToken.split('Bearer ')[1];
  const params = {
    TableName: `Dev_${UsersTableName}`,
    IndexName: UsersIndexName,
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

exports.handler = async (event) => {
  if (event.methodArn && event.methodArn.includes('staging')) {
    const userToken = event.authorizationToken;
    const user = await validateTokenStaging(userToken);
    if (user && user.user_verifications.email) {
      return generatePolicy('user', 'Allow', user.user_id);
    } else { // eslint-disable-line no-else-return
      return generatePolicy('user', 'Deny', null);
    }
  } else { // eslint-disable-line no-else-return
    const userToken = event.authorizationToken;
    const user = await validateToken(userToken);
    if (user && user.user_verifications.email) {
      return generatePolicy('user', 'Allow', user.user_id);
    } else { // eslint-disable-line no-else-return
      return generatePolicy('user', 'Deny', null);
    }
  }
};
