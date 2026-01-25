export function bskyTitle(page, unreadCountLabel) {
    var unreadPrefix = unreadCountLabel ? "(".concat(unreadCountLabel, ") ") : '';
    return "".concat(unreadPrefix).concat(page, " \u2014 Bluesky");
}
