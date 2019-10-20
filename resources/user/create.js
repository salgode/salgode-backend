var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var { uuid } = require('../../utils');
var {
  InternalServerError,
  ValidationErrorEmailAlreadyInUse,
  ValidationErrorPasswordMismatch
} = require('../../constants/validationResponses');

module.exports = function(event, callback) {
  console.log('enters create');
  var timestamp = new Date().getTime();

  var params = {
    TableName: event.TableName,
    Item: {
      id: uuid(),
      ...event.payload.Item,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    ConditionExpression: 'attribute_not_exists(email)'
  };

  console.log('params\n', params);

  if (params.Item.password !== params.Item.passwordRepeat) {
    return callback(null, ValidationErrorPasswordMismatch);
  }

  dynamoDb.put(params, error => {
    if (error) {
      console.error(error);
      if (error.code === 'ConditionalCheckFailedException') {
        return callback(null, ValidationErrorEmailAlreadyInUse);
      }
      return callback(null, InternalServerError);
    }

    var response = {
      statusCode: 200,
      body: params.Item
    };
    return callback(null, response);
  });
};
