var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import format from 'date-fns/format';
import { LogLevel } from '#/logger/types';
import { prepareMetadata } from '#/logger/util';
import { IS_WEB } from '#/env';
/**
 * Used in dev mode to nicely log to the console
 */
export var consoleTransport = function (level, context, message, metadata, timestamp) {
    var _a, _b;
    var hasMetadata = Object.keys(metadata).length;
    if (IS_WEB) {
        var cssColor = (_a = {},
            _a[LogLevel.Debug] = 'magenta',
            _a[LogLevel.Info] = 'dodgerblue',
            _a[LogLevel.Log] = 'green',
            _a[LogLevel.Warn] = 'orange',
            _a[LogLevel.Error] = 'red',
            _a)[level];
        var timestampStr = format(timestamp, 'HH:mm:ss');
        var contextStr = context ? " (".concat(context, ")") : '';
        var messageStr = message ? " ".concat(message.toString()) : '';
        var styledPart = "%c".concat(timestampStr).concat(contextStr, "%c").concat(messageStr);
        var styles = ["color: ".concat(cssColor, "; font-weight: bold"), 'color: inherit'];
        if (hasMetadata) {
            console.groupCollapsed.apply(console, __spreadArray([styledPart], styles, false));
            console.log(prepareMetadata(metadata));
            console.groupEnd();
        }
        else {
            console.log.apply(console, __spreadArray([styledPart], styles, false));
        }
        if (message instanceof Error) {
            // for stacktrace
            console.error(message);
        }
    }
    else {
        var colorize = withColor((_b = {},
            _b[LogLevel.Debug] = colors.magenta,
            _b[LogLevel.Info] = colors.blue,
            _b[LogLevel.Log] = colors.green,
            _b[LogLevel.Warn] = colors.yellow,
            _b[LogLevel.Error] = colors.red,
            _b)[level]);
        var msg = "".concat(colorize(format(timestamp, 'HH:mm:ss')));
        if (context) {
            msg += " ".concat(colorize("(".concat(context, ")")));
        }
        if (message) {
            msg += " ".concat(message.toString());
        }
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
