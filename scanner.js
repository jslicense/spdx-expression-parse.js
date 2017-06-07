var ids = require('spdx-license-ids')
var exceptions = require('spdx-exceptions')

module.exports = function () {
  this.setInput = function (string) {
    this.tokens = lex(string)
  }
  this.lex = function () {
    var token = this.tokens.shift()
    this.yylineno = 1
    this.yytext = token.string
    this.yyloc = {
      first_line: 1,
      last_line: 1,
      first_column: token.start,
      last_column: token.end
    }
    return token.type
  }
}

var DOCUMENTREF = /^DocumentRef-([0-9A-Za-z-+.]+)$/
var LICENSEREF = /^LicenseRef-([0-9A-Za-z-+.]+)$/
var INVALID_CHARACTER = /[^ 0-9A-Za-z.+\-()]/
var SINGLE_CHARACTER_TOKENS = ['(', ')', ':', '+']

var includes = Array.prototype.includes
  ? function (array, element) {
    return array.includes(element)
  }
  : function (array, element) {
    return array.indexOf(element) !== -1
  }

function lex (argument) {
  if (INVALID_CHARACTER.test(argument)) {
    throw new Error('Invalid character')
  }
  var tokens = []
  var characterBuffer = ''
  var startedBuffering = null
  var length = argument.length
  for (var offset = 0; offset < length; offset++) {
    var character = argument[offset]
    if (character === ' ') {
      pushBuffered()
    } else if (includes(SINGLE_CHARACTER_TOKENS, character)) {
      pushBuffered()
      tokens.push({
        type: tokenTypeForString(character, offset),
        string: character,
        start: offset,
        end: offset + 1
      })
    } else {
      if (startedBuffering === null) {
        startedBuffering = offset
      }
      characterBuffer += character
    }
  }
  pushBuffered()
  tokens.push({
    type: 'EOS',
    string: '',
    start: argument.length,
    end: argument.length
  })
  return tokens

  function pushBuffered () {
    if (characterBuffer) {
      tokens.push({
        type: tokenTypeForString(characterBuffer, startedBuffering),
        string: characterBuffer,
        start: startedBuffering,
        end: startedBuffering + characterBuffer.length
      })
      characterBuffer = ''
      startedBuffering = null
    }
  }
}

function tokenTypeForString (string, start) {
  if (ids.indexOf(string) !== -1) {
    return 'LICENSE'
  } else if (string === 'AND') {
    return string
  } else if (string === 'OR') {
    return string
  } else if (string === 'WITH') {
    return string
  } else if (exceptions.indexOf(string) !== -1) {
    return 'EXCEPTION'
  } else if (LICENSEREF.test(string)) {
    return 'LICENSEREF'
  } else if (DOCUMENTREF.test(string)) {
    return 'DOCUMENTREF'
  } else if (string === '(') {
    return 'OPEN'
  } else if (string === ')') {
    return 'CLOSE'
  } else if (string === ':') {
    return 'COLON'
  } else if (string === '+') {
    return 'PLUS'
  } else {
    throw new Error('Invalid input at offset ' + start)
  }
}
