var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var {
  InternalServerError,
  ValidationErrorInvalidCredentials
} = require('../../constants/validationResponses');

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

  return dynamoDb.get(params, (error, data) => {
    if (error) {
      console.log('before error');
      console.error(error);
      console.log('after error');
      // if (Usuario no existe) {
      //   return callback(null, ValidationErrorInvalidCredentials);
      // }
      return callback(null, InternalServerError);
    }

    console.log(data);
    delete data.Item.password;

    var response = {
      statusCode: 200,
      body: data.Item
    };
    return callback(null, response);
  });
};
