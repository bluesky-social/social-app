export function suggestLinkCardUri(suggestLinkImmediately, nextDetectedUris, prevDetectedUris, pastSuggestedUris) {
    var suggestedUris = new Set();
    for (var _i = 0, nextDetectedUris_1 = nextDetectedUris; _i < nextDetectedUris_1.length; _i++) {
        var _a = nextDetectedUris_1[_i], uri = _a[0], nextMatch = _a[1];
        if (!isValidUrlAndDomain(uri)) {
            continue;
        }
        if (pastSuggestedUris.has(uri)) {
            // Don't suggest already added or already dismissed link cards.
            continue;
        }
        if (suggestLinkImmediately) {
            // Immediately add the pasted or intent-prefilled link without waiting to type more.
            suggestedUris.add(uri);
            continue;
        }
        var prevMatch = prevDetectedUris.get(uri);
        if (!prevMatch) {
            // If the same exact link wasn't already detected during the last keystroke,
            // it means you're probably still typing it. Disregard until it stabilizes.
            continue;
        }
        var prevTextAfterUri = prevMatch.rt.unicodeText.slice(prevMatch.facet.index.byteEnd);
        var nextTextAfterUri = nextMatch.rt.unicodeText.slice(nextMatch.facet.index.byteEnd);
        if (prevTextAfterUri === nextTextAfterUri) {
            // The text you're editing is before the link, e.g.
            // "abc google.com" -> "abcd google.com".
            // This is a good time to add the link.
            suggestedUris.add(uri);
            continue;
        }
        if (/^\s/m.test(nextTextAfterUri)) {
            // The link is followed by a space, e.g.
            // "google.com" -> "google.com " or
            // "google.com." -> "google.com ".
            // This is a clear indicator we can linkify it.
            suggestedUris.add(uri);
            continue;
        }
        if (/^[)]?[.,:;!?)](\s|$)/m.test(prevTextAfterUri) &&
            /^[)]?[.,:;!?)]\s/m.test(nextTextAfterUri)) {
            // The link was *already* being followed by punctuation,
            // and now it's followed both by punctuation and a space.
            // This means you're typing after punctuation, e.g.
            // "google.com." -> "google.com. " or
            // "google.com.foo" -> "google.com. foo".
            // This means you're not typing the link anymore, so we can linkify it.
            suggestedUris.add(uri);
            continue;
        }
    }
    for (var _b = 0, pastSuggestedUris_1 = pastSuggestedUris; _b < pastSuggestedUris_1.length; _b++) {
        var uri = pastSuggestedUris_1[_b];
        if (!nextDetectedUris.has(uri)) {
            // If a link is no longer detected, it's eligible for suggestions next time.
            pastSuggestedUris.delete(uri);
        }
    }
    var suggestedUri;
    if (suggestedUris.size > 0) {
        suggestedUri = Array.from(suggestedUris)[0];
        pastSuggestedUris.add(suggestedUri);
    }
    return suggestedUri;
}
// https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
// question credit Muhammad Imran Tariq https://stackoverflow.com/users/420613/muhammad-imran-tariq
// answer credit Christian David https://stackoverflow.com/users/967956/christian-david
function isValidUrlAndDomain(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}
