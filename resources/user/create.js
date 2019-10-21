var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var { uuid } = require('../../utils');
var {
  InternalServerError,
  ValidationErrorEmailAlreadyInUse,
  ValidationErrorPasswordMismatch
} = require('../../constants/errorResponses');

module.exports = function(event, callback) {
  console.log('enters create');
  var timestamp = new Date().getTime();

  var params = {
    TableName: event.TableName,
    Item: {
      id: uuid(),
      token: uuid(),
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

  delete params.Item.passwordRepeat;

  return dynamoDb.put(params, error => {
    if (error) {
      console.error(error);
      if (error.code === 'ConditionalCheckFailedException') {
        return callback(null, ValidationErrorEmailAlreadyInUse);
      }
      return callback(null, InternalServerError);
    }

    delete params.Item.password;

    var response = {
      statusCode: 200,
      body: params.Item
    };
    return callback(null, response);
  });
};
