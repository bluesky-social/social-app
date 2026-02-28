var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useHaptics } from '#/lib/haptics';
import { useRequireAuth } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { useFormatPostStatCount } from '#/components/PostControls/util';
import { Text } from '#/components/Typography';
import { PostControlButton, PostControlButtonIcon, PostControlButtonText, } from './PostControlButton';
var RepostButton = function (_a) {
    var isReposted = _a.isReposted, repostCount = _a.repostCount, onRepost = _a.onRepost, onQuote = _a.onQuote, big = _a.big, embeddingDisabled = _a.embeddingDisabled;
    var t = useTheme();
    var _ = useLingui()._;
    var requireAuth = useRequireAuth();
    var dialogControl = Dialog.useDialogControl();
    var formatPostStatCount = useFormatPostStatCount();
    var onPress = function () { return requireAuth(function () { return dialogControl.open(); }); };
    var onLongPress = function () {
        return requireAuth(function () {
            if (embeddingDisabled) {
                dialogControl.open();
            }
            else {
                onQuote();
            }
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs(PostControlButton, { testID: "repostBtn", active: isReposted, activeColor: t.palette.positive_500, big: big, onPress: onPress, onLongPress: onLongPress, label: isReposted
                    ? _(msg({
                        message: "Undo repost (".concat(plural(repostCount || 0, {
                            one: '# repost',
                            other: '# reposts',
                        }), ")"),
                        comment: 'Accessibility label for the repost button when the post has been reposted, verb followed by number of reposts and noun',
                    }))
                    : _(msg({
                        message: "Repost (".concat(plural(repostCount || 0, {
                            one: '# repost',
                            other: '# reposts',
                        }), ")"),
                        comment: 'Accessibility label for the repost button when the post has not been reposted, verb form followed by number of reposts and noun form',
                    })), children: [_jsx(PostControlButtonIcon, { icon: RepostIcon }), typeof repostCount !== 'undefined' && repostCount > 0 && (_jsx(PostControlButtonText, { testID: "repostCount", children: formatPostStatCount(repostCount) }))] }), _jsxs(Dialog.Outer, { control: dialogControl, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(RepostButtonDialogInner, { isReposted: isReposted, onRepost: onRepost, onQuote: onQuote, embeddingDisabled: embeddingDisabled })] })] }));
};
RepostButton = memo(RepostButton);
export { RepostButton };
var RepostButtonDialogInner = function (_a) {
    var isReposted = _a.isReposted, onRepost = _a.onRepost, onQuote = _a.onQuote, embeddingDisabled = _a.embeddingDisabled;
    var t = useTheme();
    var _ = useLingui()._;
    var playHaptic = useHaptics();
    var control = Dialog.useDialogContext();
    var onPressRepost = useCallback(function () {
        if (!isReposted)
            playHaptic();
        control.close(function () {
            onRepost();
        });
    }, [control, isReposted, onRepost, playHaptic]);
    var onPressQuote = useCallback(function () {
        playHaptic();
        control.close(function () {
            onQuote();
        });
    }, [control, onQuote, playHaptic]);
    var onPressClose = useCallback(function () { return control.close(); }, [control]);
    return (_jsx(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Repost or quote post"], ["Repost or quote post"])))), children: _jsxs(View, { style: a.gap_xl, children: [_jsxs(View, { style: a.gap_xs, children: [_jsxs(Button, { style: [a.justify_start, a.px_md, a.gap_sm], label: isReposted
                                ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Remove repost"], ["Remove repost"]))))
                                : _(msg({ message: "Repost", context: 'action' })), onPress: onPressRepost, size: "large", variant: "ghost", color: "primary", children: [_jsx(RepostIcon, { size: "lg", fill: t.palette.primary_500 }), _jsx(Text, { style: [a.font_semi_bold, a.text_xl], children: isReposted ? (_jsx(Trans, { children: "Remove repost" })) : (_jsx(Trans, { context: "action", children: "Repost" })) })] }), _jsxs(Button, { disabled: embeddingDisabled, testID: "quoteBtn", style: [a.justify_start, a.px_md, a.gap_sm], label: embeddingDisabled
                                ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Quote posts disabled"], ["Quote posts disabled"]))))
                                : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Quote post"], ["Quote post"])))), onPress: onPressQuote, size: "large", variant: "ghost", color: "primary", children: [_jsx(QuoteIcon, { size: "lg", fill: embeddingDisabled
                                        ? t.atoms.text_contrast_low.color
                                        : t.palette.primary_500 }), _jsx(Text, { style: [
                                        a.font_semi_bold,
                                        a.text_xl,
                                        embeddingDisabled && t.atoms.text_contrast_low,
                                    ], children: embeddingDisabled ? (_jsx(Trans, { children: "Quote posts disabled" })) : (_jsx(Trans, { children: "Quote post" })) })] })] }), _jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Cancel quote post"], ["Cancel quote post"])))), onPress: onPressClose, size: "large", color: "secondary", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] }) }));
};
RepostButtonDialogInner = memo(RepostButtonDialogInner);
export { RepostButtonDialogInner };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
