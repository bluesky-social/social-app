var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { makeProfileLink } from '#/lib/routes/links';
import { listUriToHref } from '#/lib/strings/url-helpers';
import { useSession } from '#/state/session';
import { atoms as a, useGutters, useTheme } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
export { useDialogControl as useModerationDetailsDialogControl } from '#/components/Dialog';
export function ModerationDetailsDialog(props) {
    return (_jsxs(Dialog.Outer, { control: props.control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(ModerationDetailsDialogInner, __assign({}, props))] }));
}
function ModerationDetailsDialogInner(_a) {
    var modcause = _a.modcause, control = _a.control;
    var t = useTheme();
    var xGutters = useGutters([0, 'base']);
    var _ = useLingui()._;
    var desc = useModerationCauseDescription(modcause);
    var currentAccount = useSession().currentAccount;
    var timeDiff = useGetTimeAgo({ future: true });
    var name;
    var description;
    if (!modcause) {
        name = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Content Warning"], ["Content Warning"]))));
        description = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Moderator has chosen to set a general warning on the content."], ["Moderator has chosen to set a general warning on the content."]))));
    }
    else if (modcause.type === 'blocking') {
        if (modcause.source.type === 'list') {
            var list = modcause.source.list;
            name = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["User Blocked by List"], ["User Blocked by List"]))));
            description = (_jsxs(Trans, { children: ["This user is included in the", ' ', _jsx(InlineLinkText, { label: list.name, to: listUriToHref(list.uri), style: [a.text_sm], children: list.name }), ' ', "list which you have blocked."] }));
        }
        else {
            name = _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["User Blocked"], ["User Blocked"]))));
            description = _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["You have blocked this user. You cannot view their content."], ["You have blocked this user. You cannot view their content."]))));
        }
    }
    else if (modcause.type === 'blocked-by') {
        name = _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["User Blocks You"], ["User Blocks You"]))));
        description = _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["This user has blocked you. You cannot view their content."], ["This user has blocked you. You cannot view their content."]))));
    }
    else if (modcause.type === 'block-other') {
        name = _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Content Not Available"], ["Content Not Available"]))));
        description = _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["This content is not available because one of the users involved has blocked the other."], ["This content is not available because one of the users involved has blocked the other."]))));
    }
    else if (modcause.type === 'muted') {
        if (modcause.source.type === 'list') {
            var list = modcause.source.list;
            name = _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Account Muted by List"], ["Account Muted by List"]))));
            description = (_jsxs(Trans, { children: ["This user is included in the", ' ', _jsx(InlineLinkText, { label: list.name, to: listUriToHref(list.uri), style: [a.text_sm], children: list.name }), ' ', "list which you have muted."] }));
        }
        else {
            name = _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Account Muted"], ["Account Muted"]))));
            description = _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["You have muted this account."], ["You have muted this account."]))));
        }
    }
    else if (modcause.type === 'mute-word') {
        name = _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Post Hidden by Muted Word"], ["Post Hidden by Muted Word"]))));
        description = _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["You've chosen to hide a word or tag within this post."], ["You've chosen to hide a word or tag within this post."]))));
    }
    else if (modcause.type === 'hidden') {
        name = _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Post Hidden by You"], ["Post Hidden by You"]))));
        description = _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["You have hidden this post."], ["You have hidden this post."]))));
    }
    else if (modcause.type === 'reply-hidden') {
        var isYou = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === modcause.source.did;
        name = isYou
            ? _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Reply Hidden by You"], ["Reply Hidden by You"]))))
            : _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Reply Hidden by Thread Author"], ["Reply Hidden by Thread Author"]))));
        description = isYou
            ? _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["You hid this reply."], ["You hid this reply."]))))
            : _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["The author of this thread has hidden this reply."], ["The author of this thread has hidden this reply."]))));
    }
    else if (modcause.type === 'label') {
        name = desc.name;
        description = (_jsx(Text, { emoji: true, style: [t.atoms.text, a.text_md, a.leading_snug], children: desc.description }));
    }
    else {
        // should never happen
        name = '';
        description = '';
    }
    var sourceName = desc.source || desc.sourceDisplayName || _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["an unknown labeler"], ["an unknown labeler"]))));
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Moderation details"], ["Moderation details"])))), contentContainerStyle: {
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 0,
        }, children: [_jsxs(View, { style: [xGutters, a.pb_lg], children: [_jsx(Text, { emoji: true, style: [t.atoms.text, a.text_2xl, a.font_bold, a.mb_sm], children: name }), _jsx(Text, { style: [t.atoms.text, a.text_sm, a.leading_snug], children: description })] }), (modcause === null || modcause === void 0 ? void 0 : modcause.type) === 'label' && (_jsx(View, { style: [
                    xGutters,
                    a.py_md,
                    a.border_t,
                    !IS_NATIVE && t.atoms.bg_contrast_25,
                    t.atoms.border_contrast_low,
                    {
                        borderBottomLeftRadius: a.rounded_md.borderRadius,
                        borderBottomRightRadius: a.rounded_md.borderRadius,
                    },
                ], children: modcause.source.type === 'user' ? (_jsx(Text, { style: [t.atoms.text, a.text_md, a.leading_snug], children: _jsx(Trans, { children: "This label was applied by the author." }) })) : (_jsx(_Fragment, { children: _jsxs(View, { style: [
                            a.flex_row,
                            a.justify_between,
                            a.gap_xl,
                            { paddingBottom: 1 },
                        ], children: [_jsx(Text, { style: [
                                    a.flex_1,
                                    a.leading_snug,
                                    t.atoms.text_contrast_medium,
                                ], numberOfLines: 1, children: _jsxs(Trans, { children: ["Source:", ' ', _jsx(InlineLinkText, { label: sourceName, to: makeProfileLink({
                                                did: modcause.label.src,
                                                handle: '',
                                            }), onPress: function () { return control.close(); }, children: sourceName })] }) }), modcause.label.exp && (_jsx(View, { children: _jsx(Text, { style: [
                                        a.leading_snug,
                                        a.text_sm,
                                        a.italic,
                                        t.atoms.text_contrast_medium,
                                    ], children: _jsxs(Trans, { children: ["Expires in ", timeDiff(Date.now(), modcause.label.exp)] }) }) }))] }) })) })), IS_NATIVE && _jsx(View, { style: { height: 40 } }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22;
