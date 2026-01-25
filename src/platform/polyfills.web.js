import 'array.prototype.findlast/auto';
/// <reference lib="dom" />
// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = function (cb) { return setTimeout(cb, 0); };
if (process.env.NODE_ENV !== 'production') {
    // In development, react-native-web's <View> tries to validate that
    // text is wrapped into <Text>. It doesn't catch all cases but is useful.
    // Unfortunately, it only does that via console.error so it's easy to miss.
    // This is a hack to get it showing as a redbox on the web so we catch it early.
    var realConsoleError_1 = console.error;
    var thrownErrors_1 = new WeakSet();
    console.error = function consoleErrorWrapper(msgOrError) {
        if (typeof msgOrError === 'string' &&
            msgOrError.startsWith('Unexpected text node')) {
            if (msgOrError ===
                'Unexpected text node: . A text node cannot be a child of a <View>.') {
                // This is due to a stray empty string.
                // React already handles this fine, so RNW warning is a false positive. Ignore.
                return;
            }
            var err = new Error(msgOrError);
            thrownErrors_1.add(err);
            throw err;
        }
        else if (!thrownErrors_1.has(msgOrError)) {
            return realConsoleError_1.apply(this, arguments);
        }
    };
}
