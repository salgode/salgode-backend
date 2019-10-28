const aws = require('aws-sdk');

const PlacesTableName = process.env.dynamodb_places_table_name;
const ReservationsTableName = process.env.dynamodb_reservations_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
const TripsTableName = process.env.dynamodb_trips_table_name;
const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();

function mapIdKeys(ids, key) {
  return ids.map((i) => ({
    [key]: i
  }));
}

function repeated(value, index, self) {
  return self.indexOf(value) === index;
}

async function getTrip(tripId) {
  console.log('in getTrip');
  const params = {
    TableName: TripsTableName,
    Key: {
      trip_id: tripId
    },
    ProjectionExpression:
      'trip_id, trip_status, driver_id, vehicle_id, available_seats, route_points'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function getReservations(tripId) {
  console.log('in getReservations');
  const params = {
    TableName: ReservationsTableName,
    IndexName: ReservationsIndexName,
    KeyConditionExpression: 'trip_id = :tripId',
    FilterExpression:
      'reservation_status = :expectedStatus',
    ExpressionAttributeValues: {
      ':tripId': tripId,
      ':expectedStatus': 'accepted'
    }
  };
  const data = await dynamoDB.query(params).promise();
  return data.Items;
}

async function getPlaces(placeIds) {
  console.log('in getPlaces');
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

async function getPassengers(passengerIds) {
  console.log('in getPassengers');
  const params = {
    RequestItems: {
      [UsersTableName]: {
        Keys: mapIdKeys(passengerIds, 'user_id'),
        ProjectionExpression:
          'user_id, first_name, user_identifications.selfie_image, phone',
        ConsistentRead: false
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[UsersTableName];
}

function mergeAssign(reservations, passengers, places) {
  const data = [];
  let passenger;
  let start;
  let end;
  for (let i = 0; i < reservations.length; i += 1) {
    start = places.find((p) => p.place_id === reservations[i].route.start);
    end = places.find((p) => p.place_id === reservations[i].route.end);
    passenger = passengers.find((p) => p.user_id);
    data.push({
      passenger_id: passenger.user_id,
      passenger_name: passenger.first_name,
      passenger_avatar: passenger.user_identifications.selfie_image,
      passenger_phone: passenger.phone,
      seats: reservations[i].reserved_seats,
      route: reservations[i].route,
      trip_route: { start, end }
    });
  }
  return data;
}

exports.handler = async (event) => {
  const tripId = event.pathParameters.trip;
  console.log('tripId', tripId);
  const trip = await getTrip(tripId);
  console.log('trip', trip);

  const reservations = await getReservations(tripId);
  console.log('reservations', reservations);
  const passengerIdsRaw = reservations.map((r) => r.passenger_id);
  const passengerIds = passengerIdsRaw.filter(repeated);
  console.log('passengerIds', passengerIds);

  const passengers = await getPassengers(passengerIds);
  console.log('passengers', passengers);
  const places = await getPlaces(trip.route_points);
  console.log('places', places);

  const data = mergeAssign(reservations, passengers, places);
  console.log('data', data);

  const bodyResponse = {
    trip_id: trip.trip_id,
    passengers: data
  };
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(bodyResponse)
  };
};
