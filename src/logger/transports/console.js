import format from 'date-fns/format';
import { LogLevel } from '#/logger/types';
import { prepareMetadata } from '#/logger/util';
import { IS_WEB } from '#/env';
/**
 * Used in dev mode to nicely log to the console
 */
export var consoleTransport = function (level, context, message, metadata, timestamp) {
    var _a;
    var hasMetadata = Object.keys(metadata).length;
    var colorize = withColor((_a = {},
        _a[LogLevel.Debug] = colors.magenta,
        _a[LogLevel.Info] = colors.blue,
        _a[LogLevel.Log] = colors.green,
        _a[LogLevel.Warn] = colors.yellow,
        _a[LogLevel.Error] = colors.red,
        _a)[level]);
    var msg = "".concat(colorize(format(timestamp, 'HH:mm:ss')));
    if (context) {
        msg += " ".concat(colorize("(".concat(context, ")")));
    }
    if (message) {
        msg += " ".concat(message.toString());
    }
    if (IS_WEB) {
        if (hasMetadata) {
            console.groupCollapsed(msg);
            console.log(prepareMetadata(metadata));
            console.groupEnd();
        }
        else {
            console.log(msg);
        }
        if (message instanceof Error) {
            // for stacktrace
            console.error(message);
        }
    }
    else {
        if (hasMetadata) {
            msg += " ".concat(JSON.stringify(prepareMetadata(metadata), null, 2));
        }
        console.log(msg);
        if (message instanceof Error) {
            // for stacktrace
            console.error(message);
        }
    }
};
/**
 * Color handling copied from Kleur
 *
 * @see https://github.com/lukeed/kleur/blob/fa3454483899ddab550d08c18c028e6db1aab0e5/colors.mjs#L13
 */
var colors = {
    default: [0, 0],
    blue: [36, 39],
    green: [32, 39],
    magenta: [35, 39],
    red: [31, 39],
    yellow: [33, 39],
};
function withColor(_a) {
    var x = _a[0], y = _a[1];
    var rgx = new RegExp("\\x1b\\[".concat(y, "m"), 'g');
    var open = "\u001B[".concat(x, "m"), close = "\u001B[".concat(y, "m");
    return function (txt) {
        if (txt == null)
            return txt;
        return (open +
            (~('' + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) +
            close);
    };
}
