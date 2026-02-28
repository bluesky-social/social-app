import { plural } from '@lingui/core/macro';
import psl from 'psl';
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
var serviceUrlToNameMap = {
    'twitch.tv': 'Twitch',
    'youtube.com': 'YouTube',
    'nba.com': 'NBA',
    'nba.smart.link': 'nba.smart.link',
    'espn.com': 'ESPN',
    'stream.place': 'Streamplace',
    'skylight.social': 'Skylight',
    'bluecast.app': 'Bluecast',
};
export function getLiveServiceNames(domains) {
    var names = Array.from(new Set(Array.from(domains.values())
        .map(function (d) { return sanitizeLiveNowHost(d); })
        .map(function (d) { return serviceUrlToNameMap[d] || d; })));
    return {
        names: names,
        formatted: names.join(', '),
    };
}
export function sanitizeLiveNowHost(hostname) {
    // special case this one
    if (hostname === 'nba.smart.link') {
        return hostname;
    }
    var parsed = psl.parse(hostname);
    if (parsed.error || !parsed.listed || !parsed.domain) {
        // fall back to dumb version
        return hostname.replace(/^www\./, '');
    }
    return parsed.domain;
}
/**
 * Extracts the apex domain from a given URL, for use when matching allowed
 * Live Now hosts.
 */
export function getLiveNowHost(url) {
    var hostname = new URL(url).hostname;
    return sanitizeLiveNowHost(hostname);
}
