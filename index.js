var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var { handleUser } = require('./resources');

exports.handler = function(event, context, callback) {
  // console.log('EVENT: \n' + JSON.stringify(event, null, 2));

  if (
    !event.TableName ||
    !event.resource ||
    !event.operation ||
    !event.payload ||
    !event.payload.Item
  ) {
    console.log('main validation');
    return callback(null, { statusCode: 400 });
  }

  switch (event.resource) {
    case 'user':
      console.log('enter user');
      return handleUser(event, callback);
  }
};
