const aws = require('aws-sdk');
const	dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');

async function createTrip(carId, driverId, etd, routePoints) {
    let tripId = 'tri_'+uuidv4();
    let createdAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
    let params = {
  		TableName : process.env.dynamodb_table_name,
  		Item: {
  		  "trip_id": tripId,
        "car_id": carId,
        "driver_id": driverId,
        "etd": etd,
        "route_points": routePoints,
        "trip_status": "open",
  		  "created_at": createdAt
  		}
  	};
  	let data = await dynamoDB.put(params).promise();
  	return data;
}

exports.handler = async (event) => {
  let carId = event.car_id;
  let driverId = event.driver_id;
  let etd = event.etd;
  let routePoints = event.route_points;

  await createTrip(carId, driverId, etd, routePoints);

  let result = {
    created: true
  };

  return result;
};
