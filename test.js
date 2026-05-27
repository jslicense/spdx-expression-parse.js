'use strict'

var assert = require('assert')
var p = require('./')

// The spec is unclear about tabs and newlines
it('forbids tabs and newlines', function () {
  assert.throws(function () { p('MIT\t') })
  assert.throws(function () { p('\nMIT') })
})

it('allows many spaces', function () {
  assert.deepStrictEqual(
    p(' MIT'),
    { license: 'MIT' }
  )

  assert.deepStrictEqual(
    p('MIT '),
    { license: 'MIT' }
  )

  assert.deepStrictEqual(
    p('MIT  AND    BSD-3-Clause'),
    {
      left: { license: 'MIT' },
      conjunction: 'and',
      right: { license: 'BSD-3-Clause' }
    }
  )
})

it('forbids spaces between a license-id and a following `+`', function () {
  assert.throws(
    function () { p('MIT +') },
    /Space before `\+`/
  )
})

it('parses DocumentRefs and LicenseRefs', function () {
  assert.deepStrictEqual(
    p('LicenseRef-something'),
    { license: 'LicenseRef-something' }
  )

  assert.deepStrictEqual(
    p('DocumentRef-spdx-tool-1.2 : LicenseRef-MIT-Style-2'),
    { license: 'DocumentRef-spdx-tool-1.2:LicenseRef-MIT-Style-2' }
  )
})

it('requires DocumentRefs to be followed by LicenseRef', function () {
  assert.throws(
    function () { p('DocumentRef-something:x') },
    /Error: Unexpected `x`/
  )
  assert.throws(
    function () { p('DocumentRef-something:') },
    /Error: Unexpected end of input/
  )
})

// See the note in `parser.js`.
it('parses `AND`, `OR` and `WITH` with the correct precedence', function () {
  assert.deepStrictEqual(
    p('MIT AND BSD-3-Clause AND CC-BY-4.0'),
    {
      left: { license: 'MIT' },
      conjunction: 'and',
      right: {
        left: { license: 'BSD-3-Clause' },
        conjunction: 'and',
        right: { license: 'CC-BY-4.0' }
      }
    }
  )

  assert.deepStrictEqual(
    p('MIT AND BSD-3-Clause WITH GCC-exception-3.1 OR CC-BY-4.0 AND Apache-2.0'),
    {
      left: {
        left: { license: 'MIT' },
        conjunction: 'and',
        right: { license: 'BSD-3-Clause', exception: 'GCC-exception-3.1' }
      },
      conjunction: 'or',
      right: {
        left: { license: 'CC-BY-4.0' },
        conjunction: 'and',
        right: { license: 'Apache-2.0' }
      }
    }
  )
})

it('allows mixed-case `and`, `or`, and `with`', function () {
  var variants = [
    'MIT and BSD-3-Clause or GPL-2.0 with GCC-exception-2.0',
    'MIT aNd BSD-3-Clause oR GPL-2.0 wITh GCC-exception-2.0',
    'MIT AnD BSD-3-Clause Or GPL-2.0 WitH GCC-exception-2.0'
  ]
  var result = {
    left: {
      left: { license: 'MIT' },
      conjunction: 'and',
      right: { license: 'BSD-3-Clause' }
    },
    conjunction: 'or',
    right: {
      license: 'GPL-2.0',
      exception: 'GCC-exception-2.0'
    }
  }
  for (let index = 0; index < variants.length; index++) {
    const variant = variants[index]
    assert.deepStrictEqual(p(variant), result)
  }
})

it('supports License with exception', function ()   {
  assert.deepStrictEqual(
    p('GPL-2.0 WITH GCC-exception-2.0'),
    {
      license: 'GPL-2.0',
      exception: 'GCC-exception-2.0'
    }
  )
})

it('supports LicenseRef with exception', function ()   {
  assert.deepStrictEqual(
    p('LicenseRef-something WITH GCC-exception-2.0'),
    {
      license: 'LicenseRef-something',
      exception: 'GCC-exception-2.0'
    }
  )
  assert.deepStrictEqual(
    p('DocumentRef-somedoc : LicenseRef-something WITH GCC-exception-2.0'),
    {
      license: 'DocumentRef-somedoc:LicenseRef-something',
      exception: 'GCC-exception-2.0'
    }
  )
})

it('parses simple expressions in parens', function ()   {
  assert.deepStrictEqual(
    p('(MIT)'),
    {
      license: 'MIT'
    }
  )
  assert.deepStrictEqual(
    p('(LicenseRef-something)'),
    {
      license: 'LicenseRef-something'
    }
  )
})

it('does not validate compound expressions with exception', function () {
  assert.throws(
    function () { p('(LicenseRef-something) WITH GCC-exception-2.0') },
    /Error: Syntax error/
  )
  assert.throws(
    function () { p('(DocumentRef-somedoc : LicenseRef-something) WITH GCC-exception-2.0') },
    /Error: Syntax error/
  )
})

function it (message, test) {
  test()
}
