var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var {
  Unauthorized,
  NotFound,
  InternalServerError
} = require('../../constants/validationResponses');
var { isEmpty, uuid } = require('../../utils');

module.exports = function(event, callback) {
  console.log('enters update');
  var timestamp = new Date().getTime();

  var getParams = {
    TableName: event.TableName,
    Key: {
      email: event.payload.Key.email
    }
  };

  return dynamoDb.get(getParams, (error, getData) => {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }
    console.log('getData', getData);

    if (isEmpty(getData)) {
      return callback(null, NotFound);
    }

    if (
      event.payload.Key.token !== getData.Item.token ||
      event.payload.Key.id !== getData.Item.id ||
      event.payload.Key.email !== getData.Item.email
    ) {
      return callback(null, Unauthorized);
    }

    var putParams = {
      TableName: event.TableName,
      Key: event.payload.Key,
      Item: {
        ...getData.Item,
        ...event.payload.Item,
        updatedAt: timestamp
      }
    };

    return dynamoDb.put(putParams, error => {
      if (error) {
        console.error(error);
        return callback(null, InternalServerError);
      }

      var response = {
        statusCode: 200
      };
      return callback(null, response);
    });
  });
};
