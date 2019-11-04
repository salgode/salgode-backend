const aws = require('aws-sdk');

const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const PlacesTableName = process.env.dynamodb_places_table_name;
const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservationsForTrip(tripId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'trip_id = :trip_id',
    FilterExpression: 'reservation_status = :expectedStatus',
    ExpressionAttributeValues: {
      ':trip_id': tripId,
      ':expectedStatus': 'pending'
    },
    ProjectionExpression:
      'reservation_id, reserved_seats'
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getReservation(reservationId) {
  const params = {
    TableName: ReservationsTableName,
    Key: {
      reservation_id: reservationId
    },
    ProjectionExpression:
      'reservation_id, passenger_id, reserved_seats, route, reservation_status'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getPassengerImage(imageId) {
  const params = {
    TableName: ImagesTableName,
    Key: {
      image_id: imageId
    },
    ProjectionExpression:
      'folder_name, file_name'
  };
  const data = await dynamoDB.get(params).promise();
  return `${ImagesBaseUrl}/${data.Item.folder_name}/${data.Item.file_name}`;
}

async function getPassengerInformation(passengerId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: passengerId
    },
    ProjectionExpression:
      'first_name, phone, user_identifications, user_verifications'
  };
  const data = await dynamoDB.get(params).promise();
  const response = {
    passenger_id: passengerId,
    passenger_name: data.Item.first_name,
    passenger_phone: data.Item.phone,
    passenger_avatar: await getPassengerImage(data.Item.user_identifications.selfie_image),
    passenger_verifications: {
      email: data.Item.user_verifications.email,
      phone: data.Item.user_verifications.phone,
      selfie_image: data.Item.user_verifications.selfie_image,
      identity:
        data.Item.user_verifications.identification.front
        && data.Item.user_verifications.identification.back,
      driver_license:
        data.Item.user_verifications.driver_license.front
        && data.Item.user_verifications.driver_license.back
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
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[PlacesTableName];
}

async function formatResponse(reservation) {
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

async function singleReservationResponse(reservationId) {
  const reservation = await getReservation(reservationId);
  const result = await formatResponse(reservation);
  return result;
}

exports.handler = async (event) => {
  /* Next release - compare the request user id with the reservation user id before returning
  const userId = event.requestContext.authorizer.user_id; */
  const tripId = event.pathParameters.trip;
  const reservations = await getReservationsForTrip(tripId);

  const response = [];

  for (let i = 0; i < reservations.length; i += 1) {
    const singleReservationId = reservations[i].reservation_id;
    // eslint-disable-next-line no-await-in-loop
    const singleReservation = await singleReservationResponse(singleReservationId);
    response.push(singleReservation);
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(response)
  };
};
