var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

var {
  Unauthorized,
  ValidationErrorPasswordMismatch,
  NotFound,
  InternalServerError
} = require('../../constants/errorResponses');
var { filterEmptyKeys, isEmpty, removePassword, uuid } = require('../../utils');

module.exports = function(event, callback) {
  console.log('enters update');
  var timestamp = new Date().getTime();

  var getParams = {
    TableName: event.TableName,
    Key: {
      email: event.payload.Key.email
    }
  };

  console.log('getParams', getParams);

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
        ...removePassword(getData.Item),
        ...filterEmptyKeys(event.payload.Item),
        updatedAt: timestamp
      }
    };

    console.log('putParams before password check', putParams);

    if (putParams.Item.password || putParams.Item.passwordRepeat) {
      if (
        !putParams.Item.password ||
        !putParams.Item.passwordRepeat ||
        putParams.Item.password !== putParams.Item.passwordRepeat
      ) {
        return callback(null, ValidationErrorPasswordMismatch);
      }
    } else {
      putParams.Item['password'] = getData.Item.password;
    }

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
