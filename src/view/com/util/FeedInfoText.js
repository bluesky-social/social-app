import { jsx as _jsx } from "react/jsx-runtime";
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { useFeedSourceInfoQuery } from '#/state/queries/feed';
import { atoms as a, platform } from '#/alf';
import { WebOnlyInlineLinkText } from '#/components/Link';
import { LoadingPlaceholder } from './LoadingPlaceholder';
export function FeedNameText(_a) {
    var uri = _a.uri, href = _a.href, numberOfLines = _a.numberOfLines, style = _a.style;
    var _b = useFeedSourceInfoQuery({ uri: uri }), data = _b.data, isError = _b.isError;
    var inner;
    if (data || isError) {
        var displayName = (data === null || data === void 0 ? void 0 : data.displayName) || uri.split('/').pop() || '';
        inner = (_jsx(WebOnlyInlineLinkText, { to: href, label: displayName, style: style, numberOfLines: numberOfLines, emoji: true, children: sanitizeDisplayName(displayName) }));
    }
    else {
        inner = (_jsx(LoadingPlaceholder, { width: 80, height: 8, style: [
                a.ml_2xs,
                platform({
                    native: [a.mt_2xs],
                    web: [{ top: -1 }],
                }),
            ] }));
    }
    return inner;
}
