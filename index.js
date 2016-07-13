var parser = require('./parser.min.js').parser

module.exports = function (argument) {
  return parser.parse(argument)
}
