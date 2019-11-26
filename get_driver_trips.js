const aws = require('aws-sdk');

const TripsIndexName = process.env.dynamodb_trips_index_name;
const PlacesTableName = process.env.dynamodb_places_table_name;
let TripsTableName = process.env.dynamodb_trips_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;
let VehiclesTableName = process.env.dynamodb_vehicles_table_name;

function stagingOverwrite() {
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
  VehiclesTableName = `Dev_${process.env.dynamodb_vehicles_table_name}`;
}

const dynamoDB = new aws.DynamoDB.DocumentClient();

function repeated(value, index, self) {
  return self.indexOf(value) === index;
}

async function getTripAsDriver(userId) {
  const params = {
    TableName: TripsTableName,
    IndexName: TripsIndexName,
    KeyConditionExpression: 'driver_id = :userId',
    ProjectionExpression:
      'trip_id, trip_status, etd_info, trip_times, driver_id, vehicle_id, available_seats, current_point, route_points, updated_at',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

async function getSelf(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression:
      'user_id, first_name, last_name, phone, user_identifications, user_verifications'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getVehicles(vehicleIds) {
  const params = {
    RequestItems: {
      [VehiclesTableName]: {
        Keys: mapIdKeys(vehicleIds, 'vehicle_id'),
        ProjectionExpression:
          'vehicle_id, vehicle_attributes, vehicle_identifications'
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[VehiclesTableName];
}

async function getPlaces(placeIds) {
  const params = {
    RequestItems: {
      [PlacesTableName]: {
        Keys: mapIdKeys(placeIds, 'place_id'),
        ProjectionExpression:
          'place_id, place_name, lat, lon'
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[PlacesTableName];
}

function getRoutePlace(routePoints, places) {
  const routePlace = [];
  let place;
  for (let i = 0; i < routePoints.length; i += 1) {
    place = places.find((p) => routePoints[i] === p.place_id);
    routePlace.push({
      place_id: place.place_id,
      place_name: place.place_name,
      lat: place.lat.toString(10),
      lon: place.lon.toString(10)
    });
  }
  return routePlace;
}

function mergeItems(trips, driverSelf, vehicles, places) {
  const parsedTrips = [];
  let routePlace;
  let vehicle;
  let currentPoint;
  let startPlaceRaw;
  let startPlace;
  let endPlaceRaw;
  let endPlace;
  for (let i = 0; i < trips.length; i += 1) {
    vehicle = vehicles.find((v) => trips[i].vehicle_id === v.vehicle_id);
    routePlace = getRoutePlace(trips[i].route_points, places);
    startPlaceRaw = places.find((p) => trips[i].route_points[0] === p.place_id);
    startPlace = {
      place_id: startPlaceRaw.place_id,
      place_name: startPlaceRaw.place_name,
      lat: startPlaceRaw.lat.toString(10),
      lon: startPlaceRaw.lon.toString(10)
    };
    endPlaceRaw = places.find(
      (p) => trips[i].route_points[trips[i].route_points.length - 1] === p.place_id
    );
    endPlace = {
      place_id: endPlaceRaw.place_id,
      place_name: endPlaceRaw.place_name,
      lat: endPlaceRaw.lat.toString(10),
      lon: endPlaceRaw.lon.toString(10)
    };
    currentPoint = places.find((p) => trips[i].current_point === p.place_id);
    parsedTrips.push({
      trip_id: trips[i].trip_id,
      trip_status: trips[i].trip_status,
      etd_info: trips[i].etd_info,
      available_seats: trips[i].available_seats,
      vehicle,
      current_place: currentPoint,
      driver: {
        driver_id: driverSelf.user_id,
        driver_name: driverSelf.first_name,
        driver_phone: driverSelf.phone,
        driver_avatar: driverSelf.user_identifications.selfie_image,
        driver_verifications: {
          email: driverSelf.user_verifications.email,
          phone: driverSelf.user_verifications.phone,
          selfie_image: driverSelf.user_verifications.selfie_image,
          identity:
            driverSelf.user_verifications.identification.front
            && driverSelf.user_verifications.identification.back,
          driver_license:
            driverSelf.user_verifications.driver_license.front
            && driverSelf.user_verifications.driver_license.back
        }
      },
      trip_route_points: routePlace,
      trip_route: {
        start: startPlace,
        end: endPlace
      }
    });
  }
  return parsedTrips;
}

exports.handler = async (event) => { // eslint-disable-line no-unused-vars
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const trips = await getTripAsDriver(userId);

  if (trips.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify([])
    };
  }

  const rawVehicleIds = trips.map((t) => t.vehicle_id);
  const vehicleIds = rawVehicleIds.filter(repeated);
  const placesIdsArrays = trips.map((t) => t.route_points);
  const rawPlacesIds = placesIdsArrays.reduce((acc, cur) => [...acc, ...cur], []);
  const placesIds = rawPlacesIds.filter(repeated);

  const driverSelf = await getSelf(userId);
  delete driverSelf.password_hash;
  const vehicles = await getVehicles(vehicleIds);
  const places = await getPlaces(placesIds);

  const mergedItems = mergeItems(trips, driverSelf, vehicles, places);

  const responseItems = mergedItems.filter((t) => t.trip_status !== 'completed');

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(responseItems)
  };
  return response;
};
