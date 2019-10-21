module.exports = function filterEmptyKeys(obj) {
  var nonEmptyKeys = Object.keys(obj).filter(k => obj[k] !== '');
  var retObj = {};
  nonEmptyKeys.forEach(key => {
    retObj[key] = obj[key];
  });
  return retObj;
};
