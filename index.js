var parser = require('./generate-parser')

module.exports = function (argument) {
  return parser.parse(argument)
}
