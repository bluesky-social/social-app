/// <reference lib="dom" />

// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = (cb: () => void) => setTimeout(cb, 0)
