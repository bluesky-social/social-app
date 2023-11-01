import 'fast-text-encoding'
// @ts-ignore no decl -prf
import findLast from 'array.prototype.findlast'
export {}

findLast.shim()

/**
https://github.com/MaxArt2501/base64-js
The MIT License (MIT)
Copyright (c) 2014 MaxArt2501
 */

const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
// Regular expression to check formal correctness of base64 encoded strings
const b64re =
  /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/

globalThis.atob = (str: string): string => {
  // atob can work with strings with whitespaces, even inside the encoded part,
  // but only \t, \n, \f, \r and ' ', which can be stripped.
  str = String(str).replace(/[\t\n\f\r ]+/g, '')
  if (!b64re.test(str)) {
    throw new TypeError(
      "Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.",
    )
  }

  // Adding the padding if missing, for simplicity
  str += '=='.slice(2 - (str.length & 3))
  var bitmap,
    result = '',
    r1,
    r2,
    i = 0
  for (; i < str.length; ) {
    bitmap =
      (b64.indexOf(str.charAt(i++)) << 18) |
      (b64.indexOf(str.charAt(i++)) << 12) |
      ((r1 = b64.indexOf(str.charAt(i++))) << 6) |
      (r2 = b64.indexOf(str.charAt(i++)))

    result +=
      r1 === 64
        ? String.fromCharCode((bitmap >> 16) & 255)
        : r2 === 64
        ? String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255)
        : String.fromCharCode(
            (bitmap >> 16) & 255,
            (bitmap >> 8) & 255,
            bitmap & 255,
          )
  }
  return result
}
