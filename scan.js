'use strict'

var licenses = []
  .concat(require('spdx-license-ids'))
  .concat(require('spdx-license-ids/deprecated'))
var exceptions = require('spdx-exceptions')

module.exports = function (source, doNotValidateLicenseNames = false, expectWhiteSpaceInLicenseNames = false) {
  var index = 0

  function hasMore () {
    return index < source.length
  }

  // `value` can be a regexp or a string.
  // If it is recognized, the matching source string is returned and
  // the index is incremented. Otherwise `undefined` is returned.
  function read (value) {
    if (value instanceof RegExp) {
      var chars = source.slice(index)
      var match = chars.match(value)
      if (match) {
        index += match[0].length
        return match[0]
      }
    } else {
      if (source.indexOf(value, index) === index) {
        index += value.length
        return value
      }
    }
  }

  function skipWhitespace () {
    read(/[ ]*/)
  }

  function operator () {
    var string
    var possibilities = [/^WITH/i, /^AND/i, /^OR/i, '(', ')', ':', '+']
    for (var i = 0; i < possibilities.length; i++) {
      string = read(possibilities[i])
      if (string) {
        break
      }
    }

    if (string === '+' && index > 1 && source[index - 2] === ' ') {
      throw new Error('Space before `+`')
    }

    return string && {
      type: 'OPERATOR',
      string: string.toUpperCase()
    }
  }

  function idstring () {
    return read(/[A-Za-z0-9-.]+/)
  }

  function expectIdstring () {
    var string = idstring()
    if (!string) {
      throw new Error('Expected idstring at offset ' + index)
    }
    return string
  }

  function documentRef () {
    if (read('DocumentRef-')) {
      var string = expectIdstring()
      return { type: 'DOCUMENTREF', string: string }
    }
  }

  function licenseRef () {
    if (read('LicenseRef-')) {
      var string = expectIdstring()
      return { type: 'LICENSEREF', string: string }
    }
  }

  function identifier () {
    var begin = index
    var string = idstring()

    if (exceptions.indexOf(string) !== -1) {
      return {
        type: 'EXCEPTION',
        string: string
      }
    } else if (licenses.indexOf(string) !== -1 || doNotValidateLicenseNames) {
      return {
        type: 'LICENSE',
        string: string
      }
    }

    index = begin
  }

  // Tries to read the next token. Returns `undefined` if no token is
  // recognized.
  function parseToken () {
    // Ordering matters
    return (
      operator() ||
      documentRef() ||
      licenseRef() ||
      identifier()
    )
  }

  var tokens = []
  while (hasMore()) {
    skipWhitespace()
    if (!hasMore()) {
      break
    }
    var token = parseToken()
    if (!token) {
      throw new Error('Unexpected `' + source[index] +
                      '` at offset ' + index)
    }

    tokens.push(token)
  }

  if (expectWhiteSpaceInLicenseNames) {
    reduceExpandedLicenses(tokens)
  }

  return tokens
}

/**
 *
 * @param {Array} tokens array of tokens that the scan generated
 *
 * This method deals with the case of license names spelled with whitespace.
 * When doNotValidateLicenseNames is flagged true, license names as Apache 2.0 will generate this token array:
 *
 * [ {type: LICENSE, string: 'Apache'}, {type: LICENSE, string: '2.0'} ]
 *
 * which will then lead to errors thrown in the parser.
 *
 * After application of this method the token array will look like this:
 *
 * [ { type : LICENSE, string: 'Apache 2.0'}]
 *
 */
function reduceExpandedLicenses (tokens) {
  var i = 0
  while (i < tokens.length) {
    if (i < tokens.length - 1 && tokens[i].type === 'LICENSE' && tokens[i + 1].type === 'LICENSE') {
      var concatName = tokens[i].string + ' ' + tokens[i + 1].string
      tokens.splice(i + 1, 1)
      tokens[i] = { type: 'LICENSE', string: concatName }
    } else {
      i += 1
    }
  }
}
