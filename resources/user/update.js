var { uuid } = require('../../utils');

function parseOnRuntime(map) {
  let obj = ' set ';
  let parsedExpressionAttributeValues = {};
  let parsedExpressionAttributeNames = {};
  for (let k of Object.keys(map)) {
    if (k === 'car') {
      for (let j of Object.keys(map.car)) {
        obj += 'car.' + j + '=:' + j[0] + ', ';
        parsedExpressionAttributeValues[':' + j[0]] = map.car[j];
      }
    } else if (k === 'phone') {
      obj += k + '=:' + k[0] + k[1] + ', ';
      parsedExpressionAttributeValues[':' + k[0] + k[1]] = map[k];
    } else if (k === 'name') {
      obj += '#n=:' + k[0] + ', ';
      parsedExpressionAttributeValues[':' + k[0]] = map[k];
      parsedExpressionAttributeNames['#n'] = 'name';
    } else if (k === 'model') {
      obj += '#m=:' + k[0] + ', ';
      parsedExpressionAttributeValues[':' + k] = map.car[k];
      parsedExpressionAttributeNames['#m'] = 'model';
    } else {
      obj += k + '=:' + k[0] + ', ';
      parsedExpressionAttributeValues[':' + k[0]] = map[k];
    }
  }
  return [
    obj.slice(1, -2),
    parsedExpressionAttributeValues,
    parsedExpressionAttributeNames
  ];
}

module.exports = function(event, callback) {
  var timestamp = new Date().getTime();
  const parsed = parseOnRuntime(event.payload.Item);
  var params = {
    TableName: event.TableName,
    Key: event.Key,
    Item: {
      id: uuid(),
      ...event.payload.Item,
      updatedAt: timestamp
    },
    UpdateExpression: parsed[0],
    ExpressionAttributeValues: {
      ...parsed[1]
    }
  };
  Object.keys(parsed[2]).length === 0
    ? null
    : (params.ExpressionAttributeNames = {
        ...parsed[2]
      });
  console.log(params);
  dynamoDb.update(params, error => {
    if (error) {
      console.error(error);
      callback(null, { statusCode: 501 });
      return;
    }

    var response = {
      statusCode: 200
    };
    return callback(null, response);
  });
};
