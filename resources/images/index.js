var create = require('./upload');

module.exports = function(event, callback) {
  switch (event.operation) {
    case 'create':
      return create(event, callback);
  }
};
