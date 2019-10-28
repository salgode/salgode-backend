const aws = require('aws-sdk');

const PlacesTableName = process.env.dynamodb_places_table_name;
const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const TripsTableName = process.env.dynamodb_trips_table_name;
const TripsIndexName = process.env.dynamodb_trips_index_name;
const UsersTableName = process.env.dynamodb_users_table_name;
const VehiclesTableName = process.env.dynamodb_vehicles_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function repeated(value, index, self) {
  return self.indexOf(value) === index;
}

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

async function getTripAsDriver(userId) {
  const params = {
    TableName: TripsTableName,
    IndexName: TripsIndexName,
    KeyConditionExpression: 'driver_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getReservations(userId) {
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'passenger_id = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getTrip(tripId) {
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression: 'trip_id, driver_id, vehicle_id, route_points, trip_status, etd'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getTrips(reservations) {
  return Promise.all(
    reservations.slice(0, 10).map(async (r) => getTrip(r.trip_id))
  );
}

async function getDrivers(driverIds) {
  const params = {
    RequestItems: {
      [UsersTableName]: {
        Keys: mapIdKeys(driverIds, 'user_id'),
        ProjectionExpression:
          'user_id, first_name, phone, user_identifications.selfie_image',
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
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

function mergeItems(trips, drivers, vehicles, places) {
  const parsedTrips = [];
  let routePlace;
  let vehicle;
  let driver;
  let currentPoint;
  let startPlace;
  let endPlace;
  for (let i = 0; i < trips.length; i += 1) {
    vehicle = vehicles.find((v) => trips[i].vehicle_id === v.vehicle_id);
    routePlace = getRoutePlace(trips[i].route_points, places);
    startPlace = places.find((p) => trips[i].route_points[0] === p.place_id);
    driver = drivers.find((d) => trips[i].driver_id === d.user_id);
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
        driver_id: driver.user_id,
        driver_name: driver.first_name,
        driver_phone: driver.phone,
        driver_avatar: driver.user_identifications.selfie_image
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
  const userId = event.requestContext.authorizer.user_id;

  const allDriverTrips = await getTripAsDriver(userId);
  const reservations = await getReservations(userId);
  const allPassengerTrips = await getTrips(reservations);
  const allUserTrips = [...allPassengerTrips, ...allDriverTrips];

  const rawDriverIds = allUserTrips.map((t) => t.driver_id);
  const driverIds = rawDriverIds.filter(repeated);
  const rawVehicleIds = allUserTrips.map((t) => t.vehicle_id);
  const vehicleIds = rawVehicleIds.filter(repeated);
  const placesIdsArrays = allUserTrips.map((t) => t.route_points);
  const rawPlacesIds = placesIdsArrays.reduce((acc, cur) => [...acc, ...cur], []);
  const placesIds = rawPlacesIds.filter(repeated);

  const drivers = await getDrivers(driverIds);
  const vehicles = await getVehicles(vehicleIds);
  const places = await getPlaces(placesIds);

  const mergedItems = mergeItems(allUserTrips, drivers, vehicles, places);

  const response = {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(mergedItems)
  };
  return response;
};
