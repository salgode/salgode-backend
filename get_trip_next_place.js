const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const invalidState = {
  statusCode: 400,
  message: 'El viaje no esta en curso'
};

const NoSpotToGo = {
  statusCode: 400,
  message: 'No hay destino registrado'
};
const NotFound = {
  statusCode: 404,
  message: 'No se ha encontrado lo que buscas'
};
const InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};

module.exports.handler = function getTripNextPlace(event, context, callback) {
  // var tripId = event.tripId;
  const tripId = event.pathParameters.trip;
  console.log({ tripId });
  const getParams = {
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

    if (getData.Item.trip_status !== 'in_progress') {
      return callback(null, invalidState);
    }

    const index = getData.Item.next_stop || 0;
    const spotId = getData.Item.route_points[index];
    if (!spotId) {
      return callback(null, NoSpotToGo);
    }

    const getSpotParam = {
      TableName: 'SalgodeSpot',
      Key: {
        id: spotId
      }
    };

    return dynamoDb.get(getSpotParam, (error, spot) => {
      if (error) {
        console.error(error);
        return callback(null, InternalServerError);
      }
      const body = { next_stop_index: index, stop: spot.Item };
      const response = {
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
