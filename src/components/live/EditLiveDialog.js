var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppBskyActorStatus, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { differenceInMinutes } from 'date-fns';
import { cleanError } from '#/lib/strings/errors';
import { definitelyUrl } from '#/lib/strings/url-helpers';
import { useTickEveryMinute } from '#/state/shell';
import { atoms as a, platform, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { Clock_Stroke2_Corner0_Rounded as ClockIcon } from '#/components/icons/Clock';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { LinkPreview } from './LinkPreview';
import { useLiveLinkMetaQuery, useRemoveLiveStatusMutation, useUpsertLiveStatusMutation, } from './queries';
import { displayDuration, useDebouncedValue } from './utils';
export function EditLiveDialog(_a) {
    var control = _a.control, status = _a.status, embed = _a.embed;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { status: status, embed: embed })] }));
}
function DialogInner(_a) {
    var _b;
    var status = _a.status, embed = _a.embed;
    var control = Dialog.useDialogContext();
    var _c = useLingui(), _ = _c._, i18n = _c.i18n;
    var t = useTheme();
    var _d = useState(embed.external.uri), liveLink = _d[0], setLiveLink = _d[1];
    var _e = useState(''), liveLinkError = _e[0], setLiveLinkError = _e[1];
    var tick = useTickEveryMinute();
    var liveLinkUrl = definitelyUrl(liveLink);
    var debouncedUrl = useDebouncedValue(liveLinkUrl, 500);
    var isDirty = liveLinkUrl !== embed.external.uri;
    var _f = useLiveLinkMetaQuery(debouncedUrl), linkMeta = _f.data, hasValidLinkMeta = _f.isSuccess, linkMetaLoading = _f.isLoading, linkMetaError = _f.error;
    var record = useMemo(function () {
        if (!AppBskyActorStatus.isRecord(status.record))
            return null;
        var validation = AppBskyActorStatus.validateRecord(status.record);
        if (validation.success) {
            return validation.value;
        }
        return null;
    }, [status]);
    var _g = useUpsertLiveStatusMutation((_b = record === null || record === void 0 ? void 0 : record.durationMinutes) !== null && _b !== void 0 ? _b : 0, linkMeta, record === null || record === void 0 ? void 0 : record.createdAt), goLive = _g.mutate, isGoingLive = _g.isPending, goLiveError = _g.error;
    var _h = useRemoveLiveStatusMutation(), removeLiveStatus = _h.mutate, isRemovingLiveStatus = _h.isPending, removeLiveStatusError = _h.error;
    var _j = useMemo(function () {
        var _a;
        void tick;
        var expiry = new Date((_a = status.expiresAt) !== null && _a !== void 0 ? _a : new Date());
        return {
            expiryDateTime: expiry,
            minutesUntilExpiry: differenceInMinutes(expiry, new Date()),
        };
    }, [tick, status.expiresAt]), minutesUntilExpiry = _j.minutesUntilExpiry, expiryDateTime = _j.expiryDateTime;
    var submitDisabled = isGoingLive ||
        !hasValidLinkMeta ||
        debouncedUrl !== liveLinkUrl ||
        isRemovingLiveStatus;
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["You are Live"], ["You are Live"])))), style: web({ maxWidth: 420 }), children: [_jsxs(View, { style: [a.gap_lg], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_2xl], children: _jsx(Trans, { children: "You are Live" }) }), _jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(ClockIcon, { style: [t.atoms.text_contrast_high], size: "sm" }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], children: typeof (record === null || record === void 0 ? void 0 : record.durationMinutes) === 'number' ? (_jsxs(Trans, { children: ["Expires in ", displayDuration(i18n, minutesUntilExpiry), " at", ' ', i18n.date(expiryDateTime, {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })] })) : (_jsx(Trans, { children: "No expiry set" })) })] })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Live link" }) }), _jsx(TextField.Root, { isInvalid: !!liveLinkError || !!linkMetaError, children: _jsx(TextField.Input, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Live link"], ["Live link"])))), placeholder: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["www.mylivestream.tv"], ["www.mylivestream.tv"])))), value: liveLink, onChangeText: setLiveLink, onFocus: function () { return setLiveLinkError(''); }, onBlur: function () {
                                                if (!definitelyUrl(liveLink)) {
                                                    setLiveLinkError('Invalid URL');
                                                }
                                            }, returnKeyType: "done", autoCapitalize: "none", autoComplete: "url", autoCorrect: false, onSubmitEditing: function () {
                                                if (isDirty && !submitDisabled) {
                                                    goLive();
                                                }
                                            } }) })] }), (liveLinkError || linkMetaError) && (_jsx(Admonition, { type: "error", children: liveLinkError ? (_jsx(Trans, { children: "This is not a valid link" })) : (cleanError(linkMetaError)) })), _jsx(LinkPreview, { linkMeta: linkMeta, loading: linkMetaLoading })] }), goLiveError && (_jsx(Admonition, { type: "error", children: cleanError(goLiveError) })), removeLiveStatusError && (_jsx(Admonition, { type: "error", children: cleanError(removeLiveStatusError) })), _jsxs(View, { style: platform({
                            native: [a.gap_md, a.pt_lg],
                            web: [a.flex_row_reverse, a.gap_md, a.align_center],
                        }), children: [isDirty ? (_jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Save"], ["Save"])))), size: platform({ native: 'large', web: 'small' }), color: "primary", variant: "solid", onPress: function () { return goLive(); }, disabled: submitDisabled, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Save" }) }), isGoingLive && _jsx(ButtonIcon, { icon: Loader })] })) : (_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Close"], ["Close"])))), size: platform({ native: 'large', web: 'small' }), color: "primary", variant: "solid", onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })), _jsxs(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Remove live status"], ["Remove live status"])))), onPress: function () { return removeLiveStatus(); }, size: platform({ native: 'large', web: 'small' }), color: "negative_subtle", variant: "solid", disabled: isRemovingLiveStatus || isGoingLive, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Remove live status" }) }), isRemovingLiveStatus && _jsx(ButtonIcon, { icon: Loader })] })] })] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
