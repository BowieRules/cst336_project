exports.lengthValid = function (input, min, max) {
    return input ? input.length >= min && input.length <= max: false;
};

exports.alphabetOnly = function (input) {
  return /^[A-Za-z0-9]+$/.test(input);
};

exports.numbersOnly = function (input) {
  return /^[0-9]+$/.test(input);
};

exports.isEmail = function (input) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(input);
};