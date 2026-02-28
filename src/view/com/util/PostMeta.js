var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useQueryClient } from '@tanstack/react-query';
import { makeProfileLink } from '#/lib/routes/links';
import { forceLTR } from '#/lib/strings/bidi';
import { NON_BREAKING_SPACE } from '#/lib/strings/constants';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { niceDate } from '#/lib/strings/time';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { unstableCacheProfileView } from '#/state/queries/profile';
import { atoms as a, platform, useTheme, web } from '#/alf';
import { WebOnlyInlineLinkText } from '#/components/Link';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import { IS_ANDROID } from '#/env';
import { useActorStatus } from '#/features/liveNow';
import { TimeElapsed } from './TimeElapsed';
import { PreviewableUserAvatar } from './UserAvatar';
var PostMeta = function (opts) {
    var _a, _b, _c;
    var t = useTheme();
    var _d = useLingui(), i18n = _d.i18n, _ = _d._;
    var author = useProfileShadow(opts.author);
    var displayName = author.displayName || author.handle;
    var handle = author.handle;
    var profileLink = makeProfileLink(author);
    var queryClient = useQueryClient();
    var onOpenAuthor = opts.onOpenAuthor;
    var onBeforePressAuthor = useCallback(function () {
        unstableCacheProfileView(queryClient, author);
        onOpenAuthor === null || onOpenAuthor === void 0 ? void 0 : onOpenAuthor();
    }, [queryClient, author, onOpenAuthor]);
    var onBeforePressPost = useCallback(function () {
        unstableCacheProfileView(queryClient, author);
    }, [queryClient, author]);
    var timestampLabel = niceDate(i18n, opts.timestamp);
    var verification = useSimpleVerificationState({ profile: author });
    var live = useActorStatus(author).isActive;
    var MaybeLinkText = opts.linkDisabled ? Text : WebOnlyInlineLinkText;
    return (_jsxs(View, { style: [
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.pb_xs,
            a.gap_xs,
            a.z_20,
            opts.style,
        ], children: [opts.showAvatar && (_jsx(View, { style: [a.self_center, a.mr_2xs], children: _jsx(PreviewableUserAvatar, { size: opts.avatarSize || 16, profile: author, moderation: (_a = opts.moderation) === null || _a === void 0 ? void 0 : _a.ui('avatar'), type: ((_b = author.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user', live: live, hideLiveBadge: true, disableNavigation: opts.linkDisabled }) })), _jsxs(View, { style: [a.flex_row, a.align_end, a.flex_shrink], children: [_jsx(ProfileHoverCard, { did: author.did, children: _jsxs(View, { style: [a.flex_row, a.align_end, a.flex_shrink], children: [_jsx(MaybeLinkText, { emoji: true, numberOfLines: 1, to: profileLink, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View profile"], ["View profile"])))), disableMismatchWarning: true, onPress: opts.linkDisabled ? undefined : onBeforePressAuthor, style: [
                                        a.text_md,
                                        a.font_semi_bold,
                                        t.atoms.text,
                                        a.leading_tight,
                                        a.flex_shrink_0,
                                        { maxWidth: '70%' },
                                    ], children: forceLTR(sanitizeDisplayName(displayName, (_c = opts.moderation) === null || _c === void 0 ? void 0 : _c.ui('displayName'))) }), verification.showBadge && (_jsx(View, { style: [
                                        a.pl_2xs,
                                        a.self_center,
                                        {
                                            marginTop: platform({ web: 0, ios: 0, android: -1 }),
                                        },
                                    ], children: _jsx(VerificationCheck, { width: platform({ android: 13, default: 12 }), verifier: verification.role === 'verifier' }) })), _jsx(MaybeLinkText, { emoji: true, numberOfLines: 1, to: profileLink, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View profile"], ["View profile"])))), disableMismatchWarning: true, disableUnderline: true, onPress: opts.linkDisabled ? undefined : onBeforePressAuthor, style: [
                                        a.text_md,
                                        t.atoms.text_contrast_medium,
                                        a.leading_tight,
                                        { flexShrink: 10 },
                                    ], children: NON_BREAKING_SPACE + sanitizeHandle(handle, '@') })] }) }), _jsx(TimeElapsed, { timestamp: opts.timestamp, children: function (_a) {
                            var timeElapsed = _a.timeElapsed;
                            return (_jsxs(MaybeLinkText, { to: opts.postHref, label: timestampLabel, title: timestampLabel, disableMismatchWarning: true, disableUnderline: true, onPress: opts.linkDisabled ? undefined : onBeforePressPost, style: [
                                    a.pl_xs,
                                    a.text_md,
                                    a.leading_tight,
                                    IS_ANDROID && a.flex_grow,
                                    a.text_right,
                                    t.atoms.text_contrast_medium,
                                    web({
                                        whiteSpace: 'nowrap',
                                    }),
                                ], children: [!IS_ANDROID && (_jsxs(Text, { style: [
                                            a.text_md,
                                            a.leading_tight,
                                            t.atoms.text_contrast_medium,
                                        ], accessible: false, children: ["\u00B7", ' '] })), timeElapsed] }));
                        } })] })] }));
};
PostMeta = memo(PostMeta);
export { PostMeta };
var templateObject_1, templateObject_2;
