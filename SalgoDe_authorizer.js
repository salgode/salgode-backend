var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
function generatePolicy(principalId, effect, resource) {
  return {
    'principalId': principalId,
    'policyDocument': {
      'Version': '2012-10-17',
      'Statement': [{
        'Action': 'execute-api:Invoke',
        'Effect': effect,
        'Resource': resource
      }]
    }
  };
}
exports.handler = function(event, context, callback) {
  var token = event.authorizationToken;
  var params = {
    TableName: "SalgoDe_Users",
    Key: {
      bearer_token: token
    }
  };
  dynamodb.getItem(params, function(err, data) {
    if (err) {
      return callback(null, InternalServerError);
    } else {
      if (data.Item === undefined) {
        callback(null, generatePolicy('user', 'Deny', event.methodArn));
      } else {
        callback(null, generatePolicy('user', 'Allow', event.methodArn));
      }
    }
  });
};

var InternalServerError = {
    statusCode: 503,
    message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
  };