const aws = require('aws-sdk');

const PlacesTableName = process.env.dynamodb_places_table_name;
const TripsTableName = process.env.dynamodb_trips_table_name;
const TripsIndexName = process.env.dynamodb_trips_index_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

function repeated(value, index, self) {
  return self.indexOf(value) === index;
}

async function getTrips() {
  const params = {
    TableName: TripsTableName,
    IndexName: TripsIndexName,
    ScanIndexForward: false,
    ProjectionExpression:
      'trip_id, trip_status, etd_info, driver_id, vehicle_id, available_seats, current_point, route_points',
    KeyConditionExpression: 'trip_status = :expectedStatus',
    FilterExpression: 'available_seats > :zero',
    ExpressionAttributeValues: {
      ':expectedStatus': 'open',
      ':zero': 0
    },
    Limit: 15
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getDrivers(driverIds) {
  const params = {
    RequestItems: {
      [UsersTableName]: {
        Keys: mapIdKeys(driverIds, 'user_id'),
        ProjectionExpression:
          'user_id, first_name, phone, user_identifications.selfie_image, user_verifications',
        ConsistentRead: false
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[UsersTableName];
}

async function getVehicles(vehicleIds) {
  const params = {
    RequestItems: {
      [VehiclesTableName]: {
        Keys: mapIdKeys(vehicleIds, 'vehicle_id'),
        ProjectionExpression:
          'vehicle_id, vehicle_verifications, vehicle_attributes, vehicle_identifications',
        ConsistentRead: false
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
          'place_id, place_name',
        ConsistentRead: false
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
    routePlace.push(place);
  }
  return routePlace;
}

function mergeItems(trips, drivers, vehicles, places) {
  const parsedTrips = [];
  let routePlace;
  let vehicle;
  let driver;
  let currentPoint;
  for (let i = 0; i < trips.length; i += 1) {
    vehicle = vehicles.find((v) => trips[i].vehicle_id === v.vehicle_id);
    routePlace = getRoutePlace(trips[i].route_points, places);
    driver = drivers.find((d) => trips[i].driver_id === d.user_id);
    currentPoint = places.find((p) => trips[i].current_point === p.place_id);
    parsedTrips.push({
      trip_id: trips[i].trip_id,
      trip_status: trips[i].trip_status,
      etd_info: trips[i].etd_info,
      available_seats: trips[i].available_seats,
      vehicle,
      current_place: currentPoint,
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
      route_points: trips[i].route_points,
      trip_route_points: routePlace,
      trip_route: {
        start: routePlace[0],
        end: routePlace[routePlace.length - 1]
      }
    });
  }
  return parsedTrips;
}

exports.handler = async () => {
  const trips = await getTrips();

  if (trips.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify([])
    };
  }

  const rawDriverIds = trips.map((t) => t.driver_id);
  const driverIds = rawDriverIds.filter(repeated);
  const rawVehicleIds = trips.map((t) => t.vehicle_id);
  const vehicleIds = rawVehicleIds.filter(repeated);
  const placesIdsArrays = trips.map((t) => t.route_points);
  const rawPlacesIds = placesIdsArrays.reduce((acc, cur) => [...acc, ...cur], []);
  const placesIds = rawPlacesIds.filter(repeated);

  const drivers = await getDrivers(driverIds);
  const vehicles = await getVehicles(vehicleIds);
  const places = await getPlaces(placesIds);

  const mergedItems = mergeItems(trips, drivers, vehicles, places);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(mergedItems)
  };
  return response;
};
