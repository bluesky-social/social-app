import 'array.prototype.findlast/auto'
/// <reference lib="dom" />

// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = (cb: () => void) => setTimeout(cb, 0)

if (process.env.NODE_ENV !== 'production') {
  // In development, react-native-web's <View> tries to validate that
  // text is wrapped into <Text>. It doesn't catch all cases but is useful.
  // Unfortunately, it only does that via console.error so it's easy to miss.
  // This is a hack to get it showing as a redbox on the web so we catch it early.
  const realConsoleError = console.error
  const thrownErrors = new WeakSet()
  console.error = function consoleErrorWrapper(msgOrError) {
    if (
      typeof msgOrError === 'string' &&
      msgOrError.startsWith('Unexpected text node')
    ) {
      if (
        msgOrError ===
        'Unexpected text node: . A text node cannot be a child of a <View>.'
      ) {
        // This is due to a stray empty string.
        // React already handles this fine, so RNW warning is a false positive. Ignore.
        return
      }
      const err = new Error(msgOrError)
      thrownErrors.add(err)
      throw err
    } else if (!thrownErrors.has(msgOrError)) {
      return realConsoleError.apply(this, arguments as any)
    }
  }
}
