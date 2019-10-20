var create = require('./create');
var destroy = require('./destroy');
var list = require('./list');
var read = require('./read');
var update = require('./update');

module.exports = function(event, callback) {
  switch (event.operation) {
    case 'create':
      return create(event, callback);
    case 'destroy':
      return destroy(event, callback);
    case 'list':
      return list(event, callback);
    case 'read':
      return read(event, callback);
    case 'update':
      return update(event, callback);
  }
};
