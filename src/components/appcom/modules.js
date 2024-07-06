/* global __bsky_require__ */
/* global __bsky_chunk_load__ */

const map = new Map()

export function register(id, moduleExport) {
  map.set(id, {default: moduleExport})
}

global.__bsky_require__ = function (id) {
  return map.get(id)
}
global.__bsky_require__.u = function () {}

global.__bsky_chunk_load__ = function () {
  return {
    then(cb) {
      cb()
    },
  }
}
