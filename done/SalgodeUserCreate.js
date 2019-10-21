var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
  if (
    !event.TableName ||
    !event.resource ||
    !event.operation ||
    !event.payload ||
    !event.payload.Item
  ) {
    return callback(null, BadRequest);
  }

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

function uuid() {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(
    c
  ) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

var BadRequest = {
  statusCode: 400,
  message: 'Tu solicitud tiene errores'
};
var ValidationErrorEmailAlreadyInUse = {
  statusCode: 400,
  message: 'El email ya está en uso'
};
var ValidationErrorPasswordMismatch = {
  statusCode: 400,
  message: 'Las contraseñas no coinciden'
};
var InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};
