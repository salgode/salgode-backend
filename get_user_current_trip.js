const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const dynamoDB = new aws.DynamoDB.DocumentClient();

const TripsTableName = process.env.dynamodb_trips_table_name;
const TripsIndexName = process.env.dynamodb_trips_index_name;
const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

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

async function getTripsByDriver(userId) {
  const params = {
    TableName: TripsTableName,
    IndexName: TripsIndexName,
    ProjectionExpression:
      'trip_id, trip_status, trip_times, driver_id, vehicle_id, available_seats, current_point, route_points, updated_at',
    KeyConditionExpression: 'driver_id = :driver_id',
    FilterConditionExpression: 'trip_status = in_progress',
    ExpressionAttributeValues: {
      ':driver_id': userId
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
    FilterConditionExpression: 'reservation_status = accepted',
    ExpressionAttributeValues: {
      ':passenger_id': userId
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
        AttributesToGet: [
          'trip_id',
          'trip_status',
          'trip_times',
          'driver_id',
          'vehicle_id',
          'available_seats',
          'current_point',
          'route_points',
          'updated_at'
        ],
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
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
    ProjectionExpression: 'user_id, first_name, score, phone, user_identifications.selfie_image'
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
    ProjectionExpression: '#vehicle_id, #type, #color, #identification',
    ExpressionAttributeNames: {
      '#vehicle_id': 'vehicle_id',
      '#type': 'type',
      '#color': 'color',
      '#identification': 'identification'
    }
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

exports.handler = async (event) => {
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));
  let trips = await getTripsByDriver(userId);
  let reservations;

  // If no trip as driver, check as passenger
  if (trips.length === 0) {
    reservations = await getAcceptedReservations(userId);
    const tripIds = reservations.map((r) => r.trip_id);
    trips = await getTripsByIds(tripIds);
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
    const routeStart = theReservation
      ? theReservation.route.start
      : routePoints[0];
    const routeEnd = theReservation
      ? theReservation.route.end
      : routePoints[routePoints.length - 1];
    const nextPoint = routePoints[theTrip.current_point + 1];
    const onBoard = (isSelfDriver && theTrip.trip_status === 'in_progress')
      || (theReservation
        ? checkOnBoard(routeStart, theTrip.current_point, routePoints)
        : null);
    const responseBody = {
      on_board: onBoard,
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
        driver_avatar: theDriver.user_identifications.selfie_image
      },
      vehicle: {
        vehicle_id: theVehicle.vehicle_id,
        vehicle_type: theVehicle.type,
        vehicle_color: theVehicle.color,
        vehicle_identification: theVehicle.identification
      },
      route: {
        start: routeStart,
        end: routeEnd
      },
      trip_times: theTrip.trip_times,
      trip_route: routePoints
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
