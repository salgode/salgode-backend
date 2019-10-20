var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var { uuid } = require('../../utils');
var { InternalServerError } = require('../../constants/validationResponses');

module.exports = function(event, callback) {
  console.log('enters delete');
  var params = {
    TableName: event.TableName,
    Key: event.Key
  };

  console.log('params\n', params);

  return dynamoDb.delete(params, error => {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }

    var response = {
      statusCode: 200
    };
    return callback(null, response);
  });
};
