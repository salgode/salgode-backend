var AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
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

function removePassword(obj) {
  var retObj = {};
  Object.keys(obj).forEach(key => {
    if (key !== 'password' && key !== 'passwordRepeat') {
      retObj[key] = obj[key];
    }
  });
  return retObj;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function filterEmptyKeys(obj) {
  var nonEmptyKeys = Object.keys(obj).filter(k => obj[k] !== '');
  var retObj = {};
  nonEmptyKeys.forEach(key => {
    retObj[key] = obj[key];
  });
  return retObj;
}

var ValidationErrorPasswordMismatch = {
  statusCode: 400,
  message: 'Las contraseñas no coinciden'
};
var Unauthorized = {
  statusCode: 401,
  message: 'No estás autorizado para esto'
};
var NotFound = {
  statusCode: 404,
  message: 'No se ha encontrado lo que buscas'
};
var InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};
