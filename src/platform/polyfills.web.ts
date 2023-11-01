// @ts-ignore no decl -prf
import * as findLast from 'array.prototype.findlast'
/// <reference lib="dom" />

findLast.shim()

// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = (cb: () => void) => setTimeout(cb, 0)

// @ts-ignore not on the TS signature due to bad support -prf
if (!globalThis.Intl?.Segmenter) {
  // loading emoji mart data
  // TODO: This condition doesn't make sense; emojimart has nothing to do with Intl.
  const emojiMartScript = document.createElement('script')
  emojiMartScript.setAttribute('src', '/static/js/emoji-mart-data.js')
  document.head.appendChild(emojiMartScript)
}
