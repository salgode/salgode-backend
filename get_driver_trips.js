const aws = require('aws-sdk');

// eslint-disable-next-line import/no-absolute-path
const bearerToUserId = require('/opt/nodejs/bearer_to_user_id.js');

const TripsTableName = process.env.dynamodb_trips_table_name;
const TripsIndexName = process.env.dynamodb_trips_index_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;
const PlacesTableName = process.env.dynamodb_places_table_name;

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
    }
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
          'vehicle_id, vehicle_attributes, vehicle_identifications',
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
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

function mergeItems(trips, driverSelf, vehicles, places) {
  const parsedTrips = [];
  let routePlace;
  let vehicle;
  let currentPoint;
  let startPlace;
  let endPlace;
  for (let i = 0; i < trips.length; i += 1) {
    vehicle = vehicles.find((v) => trips[i].vehicle_id === v.vehicle_id);
    routePlace = getRoutePlace(trips[i].route_points, places);
    startPlace = places.find((p) => trips[i].route_points[0] === p.place_id);
    endPlace = places.find(
      (p) => trips[i].route_points[trips[i].route_points.length - 1] === p.place_id
    );
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
        driver_avatar: driverSelf.user_identifications.selfie_image
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
  const userId = await bearerToUserId.bearerToUserId(event.headers.Authorization.substring(7));

  const trips = await getTripAsDriver(userId);
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

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(mergedItems)
  };
  return response;
};
