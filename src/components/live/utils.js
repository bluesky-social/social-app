import { useEffect, useState } from 'react';
import { plural } from '@lingui/macro';
export function displayDuration(i18n, durationInMinutes) {
    var roundedDurationInMinutes = Math.round(durationInMinutes);
    var hours = Math.floor(roundedDurationInMinutes / 60);
    var minutes = roundedDurationInMinutes % 60;
    var minutesString = i18n._(plural(minutes, { one: '# minute', other: '# minutes' }));
    return hours > 0
        ? i18n._(minutes > 0
            ? plural(hours, {
                one: "# hour ".concat(minutesString),
                other: "# hours ".concat(minutesString),
            })
            : plural(hours, {
                one: '# hour',
                other: '# hours',
            }))
        : minutesString;
}
// Trailing debounce
export function useDebouncedValue(val, delayMs) {
    var _a = useState(val), prev = _a[0], setPrev = _a[1];
    useEffect(function () {
        var timeout = setTimeout(function () { return setPrev(val); }, delayMs);
        return function () { return clearTimeout(timeout); };
    }, [val, delayMs]);
    return prev;
}
var serviceUrlToNameMap = {
    'twitch.tv': 'Twitch',
    'www.twitch.tv': 'Twitch',
    'youtube.com': 'YouTube',
    'www.youtube.com': 'YouTube',
    'youtu.be': 'YouTube',
    'nba.com': 'NBA',
    'www.nba.com': 'NBA',
    'nba.smart.link': 'nba.smart.link',
    'espn.com': 'ESPN',
    'www.espn.com': 'ESPN',
    'stream.place': 'Streamplace',
    'skylight.social': 'Skylight',
    'bluecast.app': 'Bluecast',
    'www.bluecast.app': 'Bluecast',
};
export function getLiveServiceNames(domains) {
    var names = Array.from(new Set(Array.from(domains.values()).map(function (d) { return serviceUrlToNameMap[d] || d; })));
    return {
        names: names,
        formatted: names.join(', '),
    };
}
