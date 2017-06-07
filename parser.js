var Parser = require('jison').Parser
var options = {
  type: 'slr'
}

var words = ['AND', 'OR', 'WITH']

var quote = function (argument) {
  return '\'' + argument + '\''
}

var regexEscape = function (s) {
  return s.replace(/[\^\\$*+?.()|{}[]\/]/g, '\\$&')
}

var handleLicensesAndExceptions = function () {
  var ids = require('spdx-license-ids')
  var exceptions = require('spdx-exceptions')

  // Sort tokens longest-first (both license ids and exception strings)
  var tokens = ids.concat(exceptions)
  tokens.sort(function (a, b) { return b.length - a.length })
  return tokens.map(function (t) {
    var type = (ids.indexOf(t) >= 0) ? 'LICENSE' : 'EXCEPTION'
    return [regexEscape(t), 'return ' + quote(type)]
  })
}

var grammar = {
  lex: {
    macros: {},
    rules: [
      ['$', 'return ' + quote('EOS')],
      ['\\s+', '/* skip whitespace */'],
      ['\\+', 'return ' + quote('PLUS')],
      ['\\(', 'return ' + quote('OPEN')],
      ['\\)', 'return ' + quote('CLOSE')],
      [':', 'return ' + quote('COLON')],
      [
        'DocumentRef-([0-9A-Za-z-+.]+)',
        'return ' + quote('DOCUMENTREF')
      ],
      [
        'LicenseRef-([0-9A-Za-z-+.]+)',
        'return ' + quote('LICENSEREF')
      ]
    ]
    .concat(words.map(function (word) {
      return [word, 'return ' + quote(word)]
    }))
    .concat(handleLicensesAndExceptions())
  },
  operators: [
    ['left', 'OR'],
    ['left', 'AND'],
    ['right', 'PLUS', 'WITH']
  ],
  tokens: [
    'CLOSE',
    'COLON',
    'EXCEPTION',
    'LICENSE',
    'LICENSEREF',
    'OPEN',
    'PLUS'
  ].concat(words).join(' '),
  start: 'start',
  bnf: {
    start: [['expression EOS', 'return $$ = $1']],
    simpleExpression: [
      ['LICENSE', '$$ = {license: yytext}'],
      ['LICENSE PLUS', '$$ = {license: $1, plus: true}'],
      ['LICENSEREF', '$$ = {license: yytext}'],
      ['DOCUMENTREF COLON LICENSEREF', '$$ = {license: yytext}']
    ],
    expression: [
      ['simpleExpression', '$$ = $1'],
      ['simpleExpression WITH EXCEPTION', [
        '$$ = {exception: $3}',
        '$$.license = $1.license',
        'if ($1.hasOwnProperty(\'plus\')) {',
        '  $$.plus = $1.plus',
        '}'].join('\n')],
      [
        'expression AND expression',
        '$$ = {conjunction: \'and\', left: $1, right: $3}'
      ],
      [
        'expression OR expression',
        '$$ = {conjunction: \'or\', left: $1, right: $3}'
      ],
      ['OPEN expression CLOSE', '$$ = $2']
    ]
  }
}

module.exports = new Parser(grammar, options)
