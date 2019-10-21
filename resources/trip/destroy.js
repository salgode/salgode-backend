const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const { uuid } = require('../../utils');
const { InternalServerError } = require('../../constants/validationResponses');

module.exports = function(event, callback) {
  console.log('enters delete mode');
  const params = {
    TableName: event.TableName,
    Key: event.Key
  };

  console.log('params\n', params);

  return dynamoDb.delete(params, error => {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }

    const response = {
      statusCode: 200
    };
    return callback(null, response);
  });
};
