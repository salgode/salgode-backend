var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var { BadRequest } = require('./constants/errorResponses');
var { handleUser } = require('./resources');

exports.handler = function(event, context, callback) {
  console.log('EVENT', event);

  if (
    !event.TableName ||
    !event.resource ||
    !event.operation ||
    !event.payload ||
    !event.payload.Item
  ) {
    return callback(null, BadRequest);
  }

  switch (event.resource) {
    case 'user':
      console.log('enters user');
      return handleUser(event, callback);
  }
};
