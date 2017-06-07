var Generator = require('jison').Generator
var options = {
  type: 'slr',
  moduleType: 'commonjs',
  moduleName: 'spdxparse'
}

var words = ['AND', 'OR', 'WITH']

var grammar = {
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

console.log(new Generator(grammar, options).generate())
