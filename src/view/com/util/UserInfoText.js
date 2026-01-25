import { jsx as _jsx } from "react/jsx-runtime";
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { STALE } from '#/state/queries';
import { useProfileQuery } from '#/state/queries/profile';
import { atoms as a } from '#/alf';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { LoadingPlaceholder } from './LoadingPlaceholder';
export function UserInfoText(_a) {
    var did = _a.did, attr = _a.attr, failed = _a.failed, prefix = _a.prefix, style = _a.style;
    attr = attr || 'handle';
    failed = failed || 'user';
    var _b = useProfileQuery({
        did: did,
        staleTime: STALE.INFINITY,
    }), profile = _b.data, isError = _b.isError;
    if (isError) {
        return (_jsx(Text, { style: style, numberOfLines: 1, children: failed }));
    }
    else if (profile) {
        var text = "".concat(prefix || '').concat(sanitizeDisplayName(typeof profile[attr] === 'string' && profile[attr]
            ? profile[attr]
            : sanitizeHandle(profile.handle)));
        return (_jsx(InlineLinkText, { label: text, style: style, numberOfLines: 1, to: makeProfileLink(profile), children: _jsx(Text, { emoji: true, style: style, children: text }) }));
    }
    // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
    return (_jsx(LoadingPlaceholder, { width: 80, height: 8, style: [a.relative, { top: 1, left: 2 }] }));
}
