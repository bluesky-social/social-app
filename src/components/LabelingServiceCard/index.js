var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { getLabelingServiceTitle } from '#/lib/moderation';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useLabelerInfoQuery } from '#/state/queries/labeler';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme } from '#/alf';
import { Flag_Stroke2_Corner0_Rounded as Flag } from '#/components/icons/Flag';
import { Link as InternalLink } from '#/components/Link';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRight } from '../icons/Chevron';
export function Outer(_a) {
    var children = _a.children, style = _a.style;
    return (_jsx(View, { style: [
            a.flex_row,
            a.gap_md,
            a.w_full,
            a.p_lg,
            a.pr_md,
            a.overflow_hidden,
            style,
        ], children: children }));
}
export function Avatar(_a) {
    var avatar = _a.avatar;
    return _jsx(UserAvatar, { type: "labeler", size: 40, avatar: avatar });
}
export function Title(_a) {
    var value = _a.value;
    return (_jsx(Text, { emoji: true, style: [a.text_md, a.font_semi_bold, a.leading_tight], children: value }));
}
export function Description(_a) {
    var value = _a.value, handle = _a.handle;
    var _ = useLingui()._;
    return value ? (_jsx(Text, { numberOfLines: 2, children: _jsx(RichText, { value: value }) })) : (_jsx(Text, { emoji: true, style: [a.leading_snug], children: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["By ", ""], ["By ", ""])), sanitizeHandle(handle, '@'))) }));
}
export function RegionalNotice() {
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_row,
            a.align_center,
            a.gap_xs,
            a.pt_2xs,
            { marginLeft: -2 },
        ], children: [_jsx(Flag, { fill: t.atoms.text_contrast_low.color, size: "sm" }), _jsx(Text, { style: [a.italic, a.leading_snug], children: _jsx(Trans, { children: "Required in your region" }) })] }));
}
export function LikeCount(_a) {
    var likeCount = _a.likeCount;
    var t = useTheme();
    return (_jsx(Text, { style: [
            a.mt_sm,
            a.text_sm,
            t.atoms.text_contrast_medium,
            { fontWeight: '600' },
        ], children: _jsxs(Trans, { children: ["Liked by ", _jsx(Plural, { value: likeCount, one: "# user", other: "# users" })] }) }));
}
export function Content(_a) {
    var children = _a.children;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_1,
            a.flex_row,
            a.gap_md,
            a.align_center,
            a.justify_between,
        ], children: [_jsx(View, { style: [a.gap_2xs, a.flex_1], children: children }), _jsx(ChevronRight, { size: "md", style: [a.z_10, t.atoms.text_contrast_low] })] }));
}
/**
 * The canonical view for a labeling service. Use this or compose your own.
 */
export function Default(_a) {
    var labeler = _a.labeler, style = _a.style;
    return (_jsxs(Outer, { style: style, children: [_jsx(Avatar, { avatar: labeler.creator.avatar }), _jsxs(Content, { children: [_jsx(Title, { value: getLabelingServiceTitle({
                            displayName: labeler.creator.displayName,
                            handle: labeler.creator.handle,
                        }) }), _jsx(Description, { value: labeler.creator.description, handle: labeler.creator.handle }), labeler.likeCount ? _jsx(LikeCount, { likeCount: labeler.likeCount }) : null] })] }));
}
export function Link(_a) {
    var children = _a.children, labeler = _a.labeler;
    var _ = useLingui()._;
    return (_jsx(InternalLink, { to: {
            screen: 'Profile',
            params: {
                name: labeler.creator.handle,
            },
        }, label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View the labeling service provided by @", ""], ["View the labeling service provided by @", ""])), labeler.creator.handle)), children: children }));
}
// TODO not finished yet
export function DefaultSkeleton() {
    return (_jsx(View, { children: _jsx(Text, { children: "Loading" }) }));
}
export function Loader(_a) {
    var did = _a.did, _b = _a.loading, LoadingComponent = _b === void 0 ? DefaultSkeleton : _b, ErrorComponent = _a.error, Component = _a.component;
    var _c = useLabelerInfoQuery({ did: did }), isLoading = _c.isLoading, data = _c.data, error = _c.error;
    return isLoading ? (LoadingComponent ? (_jsx(LoadingComponent, {})) : null) : error || !data ? (ErrorComponent ? (_jsx(ErrorComponent, { error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error' })) : null) : (_jsx(Component, { labeler: data }));
}
var templateObject_1, templateObject_2;
