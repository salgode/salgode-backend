const aws = require('aws-sdk');

const ImagesBaseUrl = process.env.salgode_images_bucket_base_url;
const PlacesTableName = process.env.dynamodb_places_table_name;
const ReservationsIndexName = process.env.dynamodb_reservations_index_name;
let ImagesTableName = process.env.dynamodb_images_table_name;
let ReservationsTableName = process.env.dynamodb_reservations_table_name;
let TripsTableName = process.env.dynamodb_trips_table_name;
let UsersTableName = process.env.dynamodb_users_table_name;

function stagingOverwrite() {
  ImagesTableName = `Dev_${process.env.dynamodb_images_table_name}`;
  ReservationsTableName = `Dev_${process.env.dynamodb_reservations_table_name}`;
  TripsTableName = `Dev_${process.env.dynamodb_trips_table_name}`;
  UsersTableName = `Dev_${process.env.dynamodb_users_table_name}`;
}

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

function parseUrl(baseUrl, folder, file) {
  return `${baseUrl}/${folder}/${file}`;
}

async function getImageUrl(imageId) {
  const params = {
    TableName: ImagesTableName,
    Key: {
      image_id: imageId
    },
    ProjectionExpression: 'file_name, folder_name'
  };
  const data = await dynamoDB.get(params).promise();
  const image = data.Item;
  return parseUrl(ImagesBaseUrl, image.folder_name, image.file_name);
}

async function getReservations(tripId) {
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
  const params = {
    RequestItems: {
      [UsersTableName]: {
        Keys: mapIdKeys(passengerIds, 'user_id'),
        ProjectionExpression:
          'user_id, first_name, user_identifications.selfie_image, user_verifications, phone',
        ConsistentRead: false
      }
    }
  };
  const data = await dynamoDB.batchGet(params).promise();
  return data.Responses[UsersTableName];
}

async function mergeAssign(reservations, passengers, places) {
  const data = [];
  let passenger;
  let start;
  let end;
  for (let i = 0; i < reservations.length; i += 1) {
    start = places.find((p) => p.place_id === reservations[i].route.start);
    end = places.find((p) => p.place_id === reservations[i].route.end);
    passenger = passengers.find((p) => p.user_id === reservations[i].passenger_id);
    data.push({
      passenger_id: passenger.user_id,
      passenger_name: passenger.first_name,
      // eslint-disable-next-line no-await-in-loop
      passenger_avatar: await getImageUrl(passenger.user_identifications.selfie_image),
      passenger_phone: passenger.phone,
      passenger_verifications: {
        email: passenger.user_verifications.email,
        phone: passenger.user_verifications.phone,
        selfie_image: passenger.user_verifications.selfie_image,
        identity:
          passenger.user_verifications.identification.front
          && passenger.user_verifications.identification.back,
        driver_license:
          passenger.user_verifications.driver_license.front
          && passenger.user_verifications.driver_license.back
      },
      seats: reservations[i].reserved_seats,
      route: reservations[i].route,
      trip_route: { start, end }
    });
  }
  return data;
}

exports.handler = async (event) => {
  if (event.requestContext.stage === 'staging') { stagingOverwrite(); }
  const userId = event.requestContext.authorizer.user_id;
  const tripId = event.pathParameters.trip;
  const trip = await getTrip(tripId);

  if (trip.driver_id !== userId) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }

  const reservations = await getReservations(tripId);
  if (!(reservations.length > 0)) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        trip_id: tripId,
        passengers: []
      })
    };
  }
  const passengerIdsRaw = reservations.map((r) => r.passenger_id);
  const passengerIds = passengerIdsRaw.filter(repeated);

  const passengers = await getPassengers(passengerIds);
  const placesIds = trip.route_points.map((rp) => rp).filter(repeated);
  const places = await getPlaces(placesIds);

  const data = await mergeAssign(reservations, passengers, places);

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
