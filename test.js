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

it('allows lower-case `and`, `or`, and `with` by default', function () {
  assert.deepStrictEqual(
    p('MIT and BSD-3-Clause or GPL-2.0 with GCC-exception-2.0'),
    {
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
  )
})

function it (message, test) {
  test()
}
