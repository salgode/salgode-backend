const create = require('./create');
const destroy = require('./destroy');
const list = require('./list');
const read = require('./read');
const update = require('./update');

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
