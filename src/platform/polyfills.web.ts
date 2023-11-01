// @ts-ignore no decl -prf
import * as findLast from 'array.prototype.findlast'
/// <reference lib="dom" />

findLast.shim()

// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = (cb: () => void) => setTimeout(cb, 0)
