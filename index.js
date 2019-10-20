var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var { handleUser } = require('./resources');

exports.handler = function(event, context, callback) {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));

  if (
    !event.TableName ||
    !event.payload ||
    !event.payload.resource ||
    !event.payload.operation ||
    !event.payload.Item
  ) {
    return callback(null, { statusCode: 400 });
  }

  switch (event.resource) {
    case 'user':
      return handleUser(event, callback);
  }
};
