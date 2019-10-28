const aws = require('aws-sdk');

const dynamoDB = new aws.DynamoDB.DocumentClient();
const PlacesTableName = process.env.dynamodb_table_name_places;

async function getReservationsForUser(userId) {
  const params = {
    TableName: process.env.dynamodb_table_name_reservations,
    IndexName: process.env.dynamodb_table_name_reservations_index,
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
    TableName: process.env.dynamodb_table_name_reservations,
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
    TableName: process.env.dynamodb_table_name_trips,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression:
      'driver_id, etd_info, route_points, vehicle_id'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

// Next release
async function getDriverScore(driverId) { // eslint-disable-line no-unused-vars
  return 5;
}

async function getDriverInformation(driverId) {
  const params = {
    TableName: process.env.dynamodb_table_name_users,
    Key: {
      user_id: driverId
    },
    ProjectionExpression:
      'first_name, phone'
  };
  const data = await dynamoDB.get(params).promise();
  const response = {
    driver_id: driverId,
    driver_name: data.Item.first_name,
    driver_phone: data.Item.phone,
    driver_score: await getDriverScore(driverId)
  };
  return response;
}

async function getVehicleInformation(vehicleId) {
  const params = {
    TableName: process.env.dynamodb_table_name_vehicles,
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
  return {
    reservation_id: reservation.reservation_id,
    reservation_status: reservation.reservation_status,
    trip_id: reservation.trip_id,
    trip_role: 'passenger',
    driver: await getDriverInformation(trip.driver_id),
    vehicle: await getVehicleInformation(trip.vehicle_id),
    etd_info: trip.etd_info,
    route: trip.route,
    trip_route: await getFullPlaceInfoFromReservationRoute(reservation.route)
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
