// Code compiled with tsc supports "using" and "await using" syntax. This
// features is supported by downleveling the code to ES2017. The downleveling
// relies on `Symbol.dispose` and `Symbol.asyncDispose` symbols. These symbols
// might not be available in all environments. This package provides a polyfill
// for these symbols.

// @ts-expect-error
Symbol.dispose ??= Symbol('@@dispose')
// @ts-expect-error
Symbol.asyncDispose ??= Symbol('@@asyncDispose')
