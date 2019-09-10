'use strict'

var scan = require('./scan')
var parse = require('./parse')

module.exports = function (source, validateLicenseNames = true) {
  return parse(scan(source, validateLicenseNames))
}
