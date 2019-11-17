const aws = require('aws-sdk');

const PlacesTableName = process.env.dynamodb_places_table_name;
let ReservationsTableName = process.env.dynamodb_reservations_table_name;
let TripsTableName = process.env.dynamodb_trips_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;
let VehiclesTableName = process.env.dynamodb_vehicles_table_name;

function stagingOverwrite() {
  ReservationsTableName = `Dev_${process.env.dynamodb_reservations_table_name}`;
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
  VehiclesTableName = `Dev_${process.env.dynamodb_vehicles_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

async function getReservation(reservationId) {
  const params = {
    TableName: ReservationsTableName,
    Key: {
      reservation_id: reservationId
    },
    ProjectionExpression:
      'passenger_id, reservation_id, reserved_seats, route, reservation_status, trip_id'
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
    driver_avatar: data.Item.user_identifications.selfie_image,
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

async function getFullPlaceInfoFromReservationRoute(routePlaces) {
  const params = {
    RequestItems: {
      [PlacesTableName]: {
        Keys: [{ place_id: routePlaces.start }, { place_id: routePlaces.end }],
        ProjectionExpression:
          'place_id, place_name'
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[PlacesTableName];
}

async function formatResponse(reservation, trip) {
  const tripRoute = await getFullPlaceInfoFromReservationRoute(reservation.route);
  return {
    reservation_id: reservation.reservation_id,
    reservation_status: reservation.reservation_status,
    trip_id: reservation.trip_id,
    trip_role: 'passenger',
    driver: await getDriverInformation(trip.driver_id),
    vehicle: await getVehicleInformation(trip.vehicle_id),
    etd_info: trip.etd_info,
    route: trip.route,
    trip_route: {
      start: tripRoute.find((p) => p.place_id === reservation.route.start),
      end: tripRoute.find((p) => p.place_id === reservation.route.start)
    }
  };
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const reservationId = event.pathParameters.reservation;
  const reservation = await getReservation(reservationId);

  if (reservation.passenger_id !== userId) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }

  const trip = await getTrip(reservation.trip_id);
  const result = await formatResponse(reservation, trip);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
};
