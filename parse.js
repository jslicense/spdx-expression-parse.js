'use strict'

var licenses = []
  .concat(require('spdx-license-ids'))
  .concat(require('spdx-license-ids/deprecated'))
var exceptions = require('spdx-exceptions')

// The ABNF grammar in the spec is totally ambiguous.
//
// This parser follows the operator precedence defined in the
// `Order of Precedence and Parentheses` section.
//
// options:
//  - Set `relaxed` to `true` to accept invalid license or exception IDs.
module.exports = function (tokens, options) {
  options = options || {}
  var index = 0

  function hasMore () {
    return index < tokens.length
  }

  function token () {
    return hasMore() ? tokens[index] : null
  }

  function next () {
    if (!hasMore()) {
      throw new Error()
    }
    index++
  }

  function parseOperator (operator) {
    var t = token()
    if (t && t.type === 'OPERATOR' && operator === t.string) {
      next()
      return t.string
    }
  }

  function parseWith () {
    if (parseOperator('WITH')) {
      var t = token()
      if (t && t.type === 'IDENTIFIER') {
        if (!options.relaxed && exceptions.indexOf(t.string) === -1) {
          throw new Error('`' + t.string + '` is not a valid exception name')
        }
        next()
        return t.string
      }
      throw new Error('Expected exception after `WITH`')
    }
  }

  function parseLicenseRef () {
    // TODO: Actually, everything is concatenated into one string
    // for backward-compatibility but it could be better to return
    // a nice structure.
    var begin = index
    var string = ''
    var t = token()
    if (t.type === 'DOCUMENTREF') {
      next()
      string += 'DocumentRef-' + t.string + ':'
      if (!parseOperator(':')) {
        throw new Error('Expected `:` after `DocumentRef-...`')
      }
    }
    t = token()
    if (t.type === 'LICENSEREF') {
      next()
      string += 'LicenseRef-' + t.string
      return {license: string}
    }
    index = begin
  }

  function parseLicense () {
    var t = token()
    if (t && t.type === 'IDENTIFIER') {
      next()
      if (licenses.indexOf(t.string) === -1) {
        if (options.relaxed) {
          return {noassertion: t.string}
        }
        throw new Error('`' + t.string + '` is not a valid license name')
      }
      var node = {license: t.string}
      if (parseOperator('+')) {
        node.plus = true
      }
      var exception = parseWith()
      if (exception) {
        node.exception = exception
      }
      return node
    }
  }

  function parseParenthesizedExpression () {
    var left = parseOperator('(')
    if (!left) {
      return
    }

    var expr = parseExpression()

    if (!parseOperator(')')) {
      throw new Error('Expected `)`')
    }

    return expr
  }

  function parseAtom () {
    return (
      parseParenthesizedExpression() ||
      parseLicenseRef() ||
      parseLicense()
    )
  }

  function makeBinaryOpParser (operator, nextParser) {
    return function parseBinaryOp () {
      var left = nextParser()
      if (!left) {
        return
      }

      if (!parseOperator(operator)) {
        return left
      }

      var right = parseBinaryOp()
      if (!right) {
        throw new Error('Expected expression')
      }
      return {
        left: left,
        conjunction: operator.toLowerCase(),
        right: right
      }
    }
  }

  var parseAnd = makeBinaryOpParser('AND', parseAtom)
  var parseExpression = makeBinaryOpParser('OR', parseAnd)

  var node = parseExpression()
  if (!node || hasMore()) {
    throw new Error('Syntax error')
  }
  return node
}
