var { uuid } = require('../../utils');

module.exports = function(event, callback) {
  var timestamp = new Date().getTime();

  var params = {
    TableName: event.TableName,
    Item: {
      id: uuid(),
      ...event.payload.Item,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    ConditionExpression: 'attribute_not_exists(email)'
  };

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
