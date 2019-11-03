const aws = require('aws-sdk');

const ImagesTableName = process.env.dynamodb_images_table_name;
const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const PlacesTableName = process.env.dynamodb_places_table_name;
const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const TripsTableName = process.env.dynamodb_trips_table_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

async function getImageUrl(imageId) {
  const params = {
    TableName: ImagesTableName,
    Key: {
      image_id: imageId
    },
    ProjectionExpression: 'file_name, folder_name'
  };
  const data = await dynamoDB.get(params).promise();
  const image = data.Item;
  return parseUrl(ImagesBaseUrl, image.folder_name, image.file_name);
}

async function getReservationsForUser(userId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'passenger_id = :passenger_id',
    ExpressionAttributeValues: {
      ':passenger_id': userId
    },
    ProjectionExpression:
      'reservation_id'
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
      'reservation_id, reserved_seats, route, reservation_status, trip_id'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getTrip(tripId) {
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression:
      'driver_id, etd_info, route_points, vehicle_id'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getDriverInformation(driverId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: driverId
    },
    ProjectionExpression:
      'first_name, phone, user_identifications, user_verifications'
  };
  const data = await dynamoDB.get(params).promise();
  const response = {
    driver_id: driverId,
    driver_name: data.Item.first_name,
    driver_phone: data.Item.phone,
    driver_avatar: await getImageUrl(data.Item.user_identifications.selfie_image),
    driver_verifications: {
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

async function getVehicleInformation(vehicleId) {
  const params = {
    TableName: VehiclesTableName,
    Key: {
      vehicle_id: vehicleId
    },
    ProjectionExpression:
      'vehicle_attributes, vehicle_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  const response = {
    vehicle_id: vehicleId,
    vehicle_type: data.Item.vehicle_attributes.type,
    vehicle_color: data.Item.vehicle_attributes.color,
    vehicle_identification: data.Item.vehicle_identifications.identification
  };
  return response;
}

async function getFullPlaceInfoFromRoute(placeIds) {
  const params = {
    RequestItems: {
      [PlacesTableName]: {
        Keys: mapIdKeys(placeIds, 'place_id'),
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

async function formatResponse(reservation, trip) {
  const reservationRoute = await getFullPlaceInfoFromRoute(Object.values(reservation.route));
  const tripRoute = await getFullPlaceInfoFromRoute(trip.route_points);
  return {
    reservation_id: reservation.reservation_id,
    reservation_status: reservation.reservation_status,
    trip_id: reservation.trip_id,
    trip_role: 'passenger',
    driver: await getDriverInformation(trip.driver_id),
    vehicle: await getVehicleInformation(trip.vehicle_id),
    etd_info: trip.etd_info,
    reservation_route: {
      start: reservationRoute[0],
      end: reservationRoute[1]
    },
    trip_route: {
      start: tripRoute[0],
      end: tripRoute[tripRoute.length - 1]
    },
    trip_route_points: tripRoute
  };
}

async function singleReservationResponse(reservationId) {
  const reservation = await getReservation(reservationId);
  const trip = await getTrip(reservation.trip_id);
  const result = await formatResponse(reservation, trip);
  return result;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const reservations = await getReservationsForUser(userId);
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
