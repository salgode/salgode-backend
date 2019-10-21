const aws = require('aws-sdk');
const dynamoDb = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const bcrypt = require('bcryptjs');

const SALT_LENGTH = 15;

module.exports.handler = function(event, context, callback) {
  if (
    !event.TableName ||
    !event.resource ||
    !event.operation ||
    !event.payload ||
    !event.payload.Item
  ) {
    return callback(null, BadRequest);
  }

  console.log('enters create');
  let timestamp = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');

  let input = event.payload.Item;

  if (
    !input.email ||
    !input.name ||
    !input.lastName ||
    !input.phone ||
    !input.selfieLink ||
    !input.dniFrontLink ||
    !input.dniBackLink ||
    !input.password ||
    !input.passwordRepeat
  ) {
    return callback(null, BadRequest);
  }

  if (
    input.car &&
    !(input.car.plate && input.car.model && input.car.color && input.car.brand)
  ) {
    if (
      input.car.plate ||
      input.car.model ||
      input.car.color ||
      input.car.brand
    ) {
      return callback(null, BadRequest);
    }
    delete event.payload.Item.car;
  }

  let params = {
    TableName: event.TableName,
    Item: {
      id: 'usr_' + uuidv4(),
      token: uuidv4(),
      ...filterEmptyKeys(event.payload.Item),
      createdAt: timestamp,
      updatedAt: timestamp
    },
    ConditionExpression: 'attribute_not_exists(email)'
  };

  console.log('params\n', params);
  console.log('params\n', params);
  console.log('params\n', params);

  if (params.Item.password !== params.Item.passwordRepeat) {
    return callback(null, ValidationErrorPasswordMismatch);
  }

  delete params.Item.passwordRepeat;

  const Salt = bcrypt.genSaltSync(SALT_LENGTH);
  params.Item.password = bcrypt.hashSync(params.Item.password, Salt);

  return dynamoDb.put(params, error => {
    if (error) {
      console.error(error);
      if (error.code === 'ConditionalCheckFailedException') {
        return callback(null, ValidationErrorEmailAlreadyInUse);
      }
      return callback(null, InternalServerError);
    }

    delete params.Item.password;

    let response = {
      statusCode: 200,
      body: params.Item
    };
    return callback(null, response);
  });
};

function filterEmptyKeys(obj) {
  var nonEmptyKeys = Object.keys(obj).filter(k => obj[k] !== '');
  var retObj = {};
  nonEmptyKeys.forEach(key => {
    retObj[key] = obj[key];
  });
  return retObj;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

let BadRequest = {
  statusCode: 400,
  message: 'Tu solicitud tiene errores'
};
let ValidationErrorEmailAlreadyInUse = {
  statusCode: 400,
  message: 'El email ya está en uso'
};
let ValidationErrorPasswordMismatch = {
  statusCode: 400,
  message: 'Las contraseñas no coinciden'
};
let InternalServerError = {
  statusCode: 503,
  message: 'Algo inesperado acaba de pasar... gracias por intentar más tarde'
};
