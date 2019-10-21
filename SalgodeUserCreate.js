const aws = require('aws-sdk');
const dynamoDb = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

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
  let timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');

  let params = {
    TableName: event.TableName,
    Item: {
      id: 'usr_' + uuidv4(),
      token: uuidv4(),
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

    let response = {
      statusCode: 200,
      body: params.Item
    };
    return callback(null, response);
  });
};

let BadRequest = {
  statusCode: 400,
  message: 'Tu solicitud tiene errores'
};
let ValidationErrorEmailAlreadyInUse = {
  statusCode: 400,
  message: 'El email ya está en uso'
};
let ValidationErrorPasswordMismatch = {
  statusCode: 400,
  message: 'Las contraseñas no coinciden'
};
let InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};
