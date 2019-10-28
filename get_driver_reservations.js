const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const PlacesTableName = process.env.dynamodb_table_name_places;

async function getReservationsForTrip(tripId) {
  const params = {
    TableName: process.env.dynamodb_table_name_reservations,
    IndexName: process.env.dynamodb_table_name_reservations_index,
    KeyConditionExpression: 'trip_id = :trip_id',
    ExpressionAttributeValues: {
      ':trip_id': tripId
    },
    ProjectionExpression:
      'reservation_id, reserved_seats'
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getReservation(reservationId) {
  const params = {
    TableName: process.env.dynamodb_table_name_reservations,
    Key: {
      reservation_id: reservationId
    },
    ProjectionExpression:
      'reservation_id, passenger_id, reserved_seats, route, reservation_status'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

// Next release
async function getPassengerScore(passengerId) { // eslint-disable-line no-unused-vars
  return 5;
}

async function getPassengerImage(imageId) {
  const params = {
    TableName: process.env.dynamodb_table_name_images,
    Key: {
      image_id: imageId
    },
    ProjectionExpression:
      'folder_name, file_name'
  };
  const data = await dynamoDB.get(params).promise();
  return `https://${process.env.static_image_url_prefix}/${data.Item.folder_name}/${data.Item.file_name}`;
}

async function getPassengerInformation(passengerId) {
  const params = {
    TableName: process.env.dynamodb_table_name_users,
    Key: {
      user_id: passengerId
    },
    ProjectionExpression:
      'first_name, phone, user_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  const response = {
    passenger_id: passengerId,
    passenger_name: data.Item.first_name,
    passenger_phone: data.Item.phone,
    passenger_avatar: await getPassengerImage(data.Item.user_identifications.selfie_image),
    passenger_score: await getPassengerScore(passengerId),
    passenger_verifications: {
      phone: false,
      identity: false,
      drivers_license: false
    }
  };
  return response;
}

async function getFullPlaceInfoFromReservationRoute(routePlaces) {
  const params = {
    RequestItems: {
      [PlacesTableName]: {
        Keys: [{ place_id: routePlaces.start }, { place_id: routePlaces.end }],
        ProjectionExpression:
          'place_id, place_name',
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[PlacesTableName];
}

async function formatResponse(reservation) {
  console.log(reservation.passenger_id);
  return {
    reservation_id: reservation.reservation_id,
    reservation_status: reservation.reservation_status,
    trip_id: reservation.trip_id,
    trip_role: 'driver',
    passenger: await getPassengerInformation(reservation.passenger_id),
    reserved_seats: reservation.reserved_seats,
    reservation_route: reservation.route,
    reservation_route_places: await getFullPlaceInfoFromReservationRoute(reservation.route)
  };
}

async function singleReservationResponse(reservationId, tripId) {
  const reservation = await getReservation(reservationId);
  const result = await formatResponse(reservation);
  return result;
}

exports.handler = async (event) => {
  /* Next release - compare the request user id with the reservation user id before returning
  const userId = event.requestContext.authorizer.user_id; */
  const tripId = event.pathParameters.trip;
  const reservations = await getReservationsForTrip(tripId);

  let response = [];

  for (let i = 0; i < reservations.length; i += 1) {
    let singleReservationId = reservations[i].reservation_id;
    let singleReservation = await singleReservationResponse(singleReservationId);
    response.push(singleReservation);
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(response)
  };
};
