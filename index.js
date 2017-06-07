var parser = require('./parser')

module.exports = function (argument) {
  return parser.parse(argument)
}
