'use strict'

var scan = require('./scan')
var parse = require('./parse')

module.exports = function (source, options) {
  options = options || {}
  return parse(scan(source, options))
}
