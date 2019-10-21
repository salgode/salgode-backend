const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const { uuid } = require('../../utils');
const { genPassphrase } = require('../../utils');
const { InternalServerError } = require('../../constants/validationResponses');

module.exports = function(event, callback) {
  const timestamp = new Date().getTime();

  const params = {
    TableName: event.TableName,
    Item: {
      id: uuid(),
      ...event.payload.Item,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastSpotIndex: -1,
      requests: []
    }
  };

  console.log('params\n', params);

  dynamoDb.put(params, error => {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }

    const response = {
      statusCode: 200,
      body: params.Item
    };
    return callback(null, response);
  });
};
