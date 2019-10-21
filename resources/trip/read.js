const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const {
  InternalServerError,
  ValidationErrorInvalidCredentials
} = require('../../constants/errorResponses');
const { isEmpty } = require('../../utils');

module.exports = function(event, callback) {
  console.log('enters read');

  const params = {
    TableName: event.TableName,
    Key: {
      id: event.payload.Item.id
    }
  };

  console.log('params\n', params);

  return dynamoDb.get(params, (error, data) => {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }
    console.log(data);

    if (isEmpty(data)) {
      return callback(null, ValidationErrorInvalidCredentials);
    }

    const response = {
      statusCode: 200,
      body: data.Item
    };
    return callback(null, response);
  });
};
