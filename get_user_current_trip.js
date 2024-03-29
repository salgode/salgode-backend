const aws = require('aws-sdk');

const PlacesTableName = process.env.dynamodb_places_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const TripsIndexName = process.env.dynamodb_trips_index_name;

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

function mapTripKeys(tripsIds) {
  return tripsIds.map((tripId) => ({
    trip_id: tripId
  }));
}

function checkOnBoard(routeStart, currentPoint, tripRoute) {
  for (let i = currentPoint; i < tripRoute.length; i += 1) {
    if (routeStart === tripRoute[i]) {
      return true;
    }
  }
  return false;
}

async function getPlace(placeId) {
  const params = {
    TableName: PlacesTableName,
    Key: {
      place_id: placeId
    },
    ProjectionExpression: 'place_id, place_name'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getTripsByDriver(userId) {
  const params = {
    TableName: TripsTableName,
    IndexName: TripsIndexName,
    ProjectionExpression: 'trip_id, trip_status, etd_info, driver_id, vehicle_id, available_seats, current_point, route_points, updated_at',
    KeyConditionExpression: 'driver_id = :driver_id',
    FilterExpression: 'trip_status = :expectedStatus',
    ExpressionAttributeValues: {
      ':driver_id': userId,
      ':expectedStatus': 'in_progress'
    },
    ScanIndexForward: false
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getAcceptedReservations(userId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    ProjectionExpression: 'passenger_id, trip_id, route, updated_at',
    KeyConditionExpression: 'passenger_id = :passenger_id',
    FilterExpression: 'reservation_status = :expectedStatus',
    ExpressionAttributeValues: {
      ':passenger_id': userId,
      ':expectedStatus': 'accepted'
    },
    ScanIndexForward: false
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getTripsByIds(tripsIds) {
  const params = {
    RequestItems: {
      [TripsTableName]: {
        Keys: mapTripKeys(tripsIds),
        ProjectionExpression: 'trip_id, trip_status, etd_info, driver_id, vehicle_id, available_seats, current_point, route_points, updated_at'
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[TripsTableName];
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, score, phone, user_identifications.selfie_image, user_verifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getVehicle(vehicleId) {
  const params = {
    TableName: VehiclesTableName,
    Key: {
      vehicle_id: vehicleId
    },
    ProjectionExpression:
      'vehicle_id, vehicle_attributes, vehicle_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;

  let trips = await getTripsByDriver(userId);
  let reservations;

  // If no trip as driver, check as passenger
  if (trips.length === 0) {
    reservations = await getAcceptedReservations(userId);
    if (reservations.length !== 0) {
      const tripIds = reservations.map((r) => r.trip_id);
      trips = await getTripsByIds(tripIds);
      trips = trips.filter((t) => t.trip_status === 'in_progress');
    }
  }

  // Non empty response
  if (trips.length > 0) {
    const theTrip = trips[0];
    const theDriver = await getUser(theTrip.driver_id);
    const theVehicle = await getVehicle(theTrip.vehicle_id);
    const theReservation = reservations
      ? reservations.filter((r) => r.trip_id === theTrip.trip_id)[0]
      : null;

    const isSelfDriver = userId === theTrip.driver_id;
    const routePoints = theTrip.route_points;
    const routeStart = theReservation ? theReservation.route.start : routePoints[0];
    const routeEnd = theReservation
      ? theReservation.route.end
      : routePoints[routePoints.length - 1];
    const nextPoint = routePoints[theTrip.current_point + 1];
    const onBoard = (isSelfDriver && theTrip.trip_status === 'in_progress')
      || (theReservation
        ? checkOnBoard(routeStart, theTrip.current_point, routePoints)
        : null);

    const firstPlace = await getPlace(routeStart);
    const lastPlace = await getPlace(routeEnd);
    const routePlaces = await Promise.all(routePoints.map((rp) => getPlace(rp)));

    const responseBody = {
      on_board: !!onBoard,
      trip_id: theTrip.trip_id,
      trip_status: theTrip.trip_status,
      current_point: routePoints[theTrip.current_point],
      next_point: nextPoint,
      is_driver: isSelfDriver,
      driver: {
        driver_id: theDriver.user_id,
        driver_name: theDriver.first_name,
        driver_phone: theDriver.phone,
        driver_score: theDriver.score,
        driver_avatar: theDriver.user_identifications.selfie_image,
        driver_verifications: {
          email: theDriver.user_verifications.email,
          phone: theDriver.user_verifications.phone,
          selfie_image: theDriver.user_verifications.selfie_image,
          identity:
           theDriver.user_verifications.identification.front
            && theDriver.user_verifications.identification.back,
          driver_license:
           theDriver.user_verifications.driver_license.front
            && theDriver.user_verifications.driver_license.back
        }
      },
      vehicle: {
        vehicle_id: theVehicle.vehicle_id,
        vehicle_type: theVehicle.vehicle_attributes.type,
        vehicle_color: theVehicle.vehicle_attributes.color,
        vehicle_identification: theVehicle.vehicle_identifications.identification
      },
      route: {
        start: firstPlace,
        end: lastPlace
      },
      etd_info: theTrip.etd_info,
      trip_route: routePlaces
    };
    const response = {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
    return response;
  }

  // Empty response
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({})
  };
};
