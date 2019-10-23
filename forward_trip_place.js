const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const MissingIdOnRequestError = {
  statusCode: 400,
  message: 'Id de trip no especificada en request'
};

const TripInValidState = {
  statusCode: 400,
  message: 'Viaje no se encuentra en curso'
};
const NotFound = {
  statusCode: 404,
  message: 'No se ha encontrado lo que buscas'
};
const InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};

module.exports.handler = function forwardTripPlace(event, context, callback) {
  const timestamp = new Date().getTime();

  const tripId = event.pathParameters.trip;
  if (!tripId) return callback(null, MissingIdOnRequestError);

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
      return callback(null, TripInValidState);
    }
    getData.Item.next_stop = getData.Item.next_stop || 0;
    getData.Item.next_stop += 1;
    getData.Item.updatedAt = timestamp;

    if (getData.Item.next_stop === getData.Item.route_points.length) {
      getData.Item.trip_status = 'finished';
    }

    const putParams = {
      TableName: 'SalgoDe_Trips',
      Key: {
        trip_id: tripId
      },
      Item: getData.Item
    };

    return dynamoDb.put(putParams, (error) => {
      if (error) {
        console.error(error);
        return callback(null, InternalServerError);
      }

      const response = {
        statusCode: 200
      };
      return callback(null, response);
    });
  });
};

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}
