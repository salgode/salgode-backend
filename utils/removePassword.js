module.exports = function removePassword(obj) {
  var retObj = {};
  Object.keys(obj).forEach(key => {
    if (key !== 'password' && key !== 'passwordRepeat') {
      retObj[key] = obj[key];
    }
  });
  return retObj;
};
