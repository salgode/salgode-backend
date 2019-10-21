const AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
  var timestamp = new Date().getTime();
  
  var tripId = event.tripId;
  
  if(!tripId) return callback(null, NotFound);


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

    // if (
    //   event.payload.Key.token !== getData.Item.token ||
    //   event.payload.Key.id !== getData.Item.id ||
    //   event.payload.Key.email !== getData.Item.email
    // ) {
    //   return callback(null, Unauthorized);
    // }
    if(getData.Item.trip_status !== 'in_progress') {
    return callback(null, TripInValidState);
    }
    getData.Item.next_stop = getData.Item.next_stop || 0;
    getData.Item.next_stop = getData.Item.next_stop + 1;
    getData.Item.updatedAt = timestamp;
    
    if(getData.Item.next_stop === getData.Item.route_points.length) {
        getData.Item.trip_status = 'finished';
    }
    
    
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

var ValidationErrorPasswordMismatch = {
  statusCode: 400,
  message: 'Las contraseñas no coinciden'
};

var TripInValidState = {
  statusCode: 400,
  message: 'Viaje no se encuentra en curso'
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
