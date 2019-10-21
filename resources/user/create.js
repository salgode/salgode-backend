var { uuid } = require('../../utils');
var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var dynamoDb = new AWS.DynamoDB.DocumentClient();
var {
  validateName,
  validatePlate,
  validateColor,
  validateBrand
} = require('../../utils/validations/users');

var {
  InternalServerError,
  BadRequest,
  ValidationErrorEmailAlreadyInUse,
  ValidationErrorPasswordMismatch
} = require('../../constants/validationResponses');

module.exports = function(event, callback) {
  var timestamp = new Date().getTime();

  var params = {
    TableName: event.TableName,
    Item: {
      id: uuid(),
      ...event.payload.Item,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };
  console.log(params.Item.car);
  if (
    !validateName(params.Item.name) ||
    (params.Item.car &&
      !params.Item.car.plate &&
      !validatePlate(params.Item.car.plate)) ||
    (params.Item.car &&
      !params.Item.car.color &&
      !validateColor(params.Item.car.color)) ||
    (params.Item.car &&
      !params.Item.car.brand &&
      !validateBrand(params.Item.car.brand))
  ) {
    return callback(null, BadRequest);
  }
  console.log(params);
  dynamoDb.put(params, error => {
    if (error) {
      console.error(error);
      callback(null, { statusCode: 501 });
      return;
    }

    var response = {
      statusCode: 200,
      body: params.Item
    };
    return callback(null, response);
  });
};
