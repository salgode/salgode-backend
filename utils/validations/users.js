function validateName(str) {
  if (typeof str !== 'string') {
    return false;
  }
  str = str.trim();

  if (str.length < 'Ana'.length) {
    return false;
  }
  if (str.length >= 256) {
    return false;
  }

  // letters, dash, space
  return /^[- A-Za-zÁÉÍÓÚÑÜáéíóúñü]+$/g.test(str);
}

function validatePlate(str) {
  if (typeof str !== 'string') {
    return false;
  }
  str = str.trim();

  // old format: XX1234
  var firstLetter = 'ABCEFGHDKLNPRSTUVXYZWM';
  var secondLetter = 'ABCDEFGHIJKLNPRSTUVXYZW';
  firstLetter = '[' + firstLetter + firstLetter.toLowerCase() + ']';
  secondLetter = '[' + secondLetter + secondLetter.toLowerCase() + ']';
  var oldFormat = new RegExp(
    '^' + firstLetter + secondLetter + '[1-9][0-9][0-9][0-9]$',
    'g'
  );

  // new format: XXXX12
  var whitelist = 'BCDFGHJKLPRSTVWXYZ';
  var letter = '[' + whitelist + whitelist.toLowerCase() + ']';
  var newFormat = new RegExp(
    '^' + letter + letter + letter + letter + '[1-9][0-9]$',
    'g'
  );

  return oldFormat.test(str) || newFormat.test(str);
}

function validateColor(str) {
  if (typeof str !== 'string') {
    return false;
  }
  str = str.trim();

  if (str.length < 'azul'.length) {
    return false;
  }
  if (str.length >= 256) {
    return false;
  }

  // letters, dash, space, parenthesis
  return /^[- A-Za-z()ÁÉÍÓÚÑÜáéíóúñü]+$/g.test(str);
}

function validateBrand(str) {
  if (typeof str !== 'string') {
    return false;
  }
  str = str.trim();

  if (str.length < 'BMW'.length) {
    return false;
  }
  if (str.length >= 256) {
    return false;
  }

  // letters, numbers, dash, space, parenthesis
  return /^[- A-Za-z\d()ÁÉÍÓÚÑÜáéíóúñü]+$/g.test(str);
}

function validateModel(str) {
  return validateBrand(str);
}
