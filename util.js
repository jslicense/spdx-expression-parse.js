
function map (array, func) {
  var result = []
  for (var i = 0; i < array.length; i++) {
    result.push(func(array[i]))
  }
  return result
}

// Returns the return value of the first function which returns a
// truthy value.
function oneOf (functions) {
  for (var i = 0; i < functions.length; i++) {
    var result = functions[i]()
    if (result) {
      return result
    }
  }
}

module.exports = {
  map: map,
  oneOf: oneOf
}
