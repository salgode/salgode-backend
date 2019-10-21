const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
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
      console.error(error);
      return callback(null, InternalServerError);
    }
    console.log(data);

    if (!isEmpty(data) && bcrypt.compareSync(event.payload.Item.password, data.Item.password)) {
      return callback(null, ValidationErrorInvalidCredentials);
    }

    var response = {
      statusCode: 200,
      body: data.Item
    };
    return callback(null, response);
  });
};

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

var ValidationErrorInvalidCredentials = {
  statusCode: 401,
  message: 'Credenciales inválidas'
};
var InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};
