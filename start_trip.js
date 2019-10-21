const AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
  var timestamp = new Date().getTime();
  var tripId = event.pathParameters.trip;
  console.log(tripId);
  var getParams = {
    TableName: 'SalgoDe_Trips',
    Key: {
      trip_id: tripId
    }
  };

  return dynamoDb.get(getParams, (error, getData) => {
    if (error) {
      console.error(error);
      return callback(null, InternalServerError);
    }

    if (isEmpty(getData)) {
      return callback(null, NotFound);
    }

    getData.Item.trip_status = 'in_progress';
    getData.Item.next_stop = 0;
    getData.Item.updatedAt = timestamp;

    var putParams = {
      TableName: 'SalgoDe_Trips',
      Key: {
        trip_id: tripId
      },
      Item: getData.Item
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

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

var MissingIdOnRequestError = {
  statusCode: 400,
  message: 'Id de trip no especificada en request'
};

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
