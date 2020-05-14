'use strict'

var scan = require('./scan')
var parse = require('./parse')

module.exports = function (source, doNotValidateLicenseNames = false, expectWhiteSpaceInLicenseNames = false) {
  return parse(scan(source, doNotValidateLicenseNames, expectWhiteSpaceInLicenseNames))
}
