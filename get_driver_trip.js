const aws = require('aws-sdk');

const PlacesTableName = process.env.dynamodb_places_table_name;
const TripsTableName = process.env.dynamodb_trips_table_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

async function getTrip(tripId) {
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression:
      'trip_id, trip_status, etd_info, trip_times, driver_id, vehicle_id, available_seats, current_point, route_points'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'user_id, first_name, last_name, phone, user_identifications, user_verifications'
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

async function getPlaces(placeIds) {
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

function getRoutePlace(routePoints, places) {
  const routePlace = [];
  let place;
  for (let i = 0; i < routePoints.length; i += 1) {
    place = places.find((p) => routePoints[i] === p.place_id);
    routePlace.push(place);
  }
  return routePlace;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;

  const tripId = event.pathParameters.trip;
  const trip = await getTrip(tripId);

  const vehicle = await getVehicle(trip.vehicle_id);
  const driver = await getUser(userId);
  const places = await getPlaces(trip.route_points);
  const routePlace = await getRoutePlace(trip.route_points, places);
  const startPlace = routePlace[0];
  const endPlace = routePlace[routePlace.length - 1];

  const bodyResponse = {
    trip_id: trip.trip_id,
    trip_status: trip.trip_status,
    etd_info: trip.etd_info,
    available_seats: trip.available_seats,
    vehicle,
    driver: {
      driver_id: driver.user_id,
      driver_name: driver.first_name,
      driver_phone: driver.phone,
      driver_avatar: driver.user_identifications.selfie_image,
      driver_verifications: {
        email: driver.user_verifications.email,
        phone: driver.user_verifications.phone,
        selfie_image: driver.user_verifications.selfie_image,
        identity:
          driver.user_verifications.identification.front
          && driver.user_verifications.identification.back,
        driver_license:
          driver.user_verifications.driver_license.front
          && driver.user_verifications.driver_license.back
      }
    },
    trip_route_points: routePlace,
    trip_route: {
      start: startPlace,
      end: endPlace
    }
  };
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(bodyResponse)
  };
};
