const AWS = require('aws-sdk');
var dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = function(event, context, callback) {
  // var tripId = event.tripId;
  var tripId = event.pathParameters.trip;
  console.log({ tripId });
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
    console.log(getData.Item);
    if (getData.Item.trip_status !== 'in_progress') {
      return callback(null, invalidState);
    }

    var index = getData.Item.next_stop || 0;
    var spot_id = getData.Item.route_points[index];
    console.log('VAMOS VAMOS', spot_id);
    if (!spot_id) {
      return callback(null, noSpotToGo);
    }

    var getSpotParam = {
      TableName: 'SalgodeSpot',
      Key: {
        id: spot_id
      }
    };

    return dynamoDb.get(getSpotParam, (error, spot) => {
      if (error) {
        console.error(error);
        return callback(null, InternalServerError);
      }
      const body = { next_stop_index: index, stop: spot.Item };
      var response = {
        statusCode: 200,
        body: JSON.stringify(body)
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

var invalidState = {
  statusCode: 400,
  message: 'El viaje no esta en curso'
};

var noSpotToGo = {
  statusCode: 400,
  message: 'No hay destino registrado'
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
