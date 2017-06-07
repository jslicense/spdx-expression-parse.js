var Scanner = require('./scanner')
var Parser = require('./parser').Parser

module.exports = function (string) {
  var parser = new Parser()
  parser.lexer = new Scanner()
  return parser.parse(string)
}
