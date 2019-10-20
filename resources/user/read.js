var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var {
  InternalServerError,
  ValidationErrorInvalidCredentials
} = require('../../constants/validationResponses');
var { isEmpty } = require('../../utils');

module.exports = function(event, callback) {
  console.log('enters read');
  var timestamp = new Date().getTime();

  var params = {
    TableName: event.TableName,
    Key: {
      email: event.payload.Item.email
    }
  };

  console.log('params\n', params);

  return dynamoDb.get(params, function(error, data) {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }
    console.log(data);

    if (isEmpty(data) || data.Item.password !== event.payload.Item.password) {
      return callback(null, ValidationErrorInvalidCredentials);
    }

    var response = {
      statusCode: 200,
      body: data.Item
    };
    return callback(null, response);
  });
};
