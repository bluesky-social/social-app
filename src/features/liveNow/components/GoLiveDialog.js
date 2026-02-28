var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useDebouncedValue } from '#/lib/hooks/useDebouncedValue';
import { cleanError } from '#/lib/strings/errors';
import { definitelyUrl } from '#/lib/strings/url-helpers';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useTickEveryMinute } from '#/state/shell';
import { atoms as a, ios, native, platform, useTheme, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
import * as Select from '#/components/Select';
import { Text } from '#/components/Typography';
import { displayDuration, getLiveServiceNames, useLiveLinkMetaQuery, useLiveNowConfig, useUpsertLiveStatusMutation, } from '#/features/liveNow';
import { LinkPreview } from './LinkPreview';
export function GoLiveDialog(_a) {
    var control = _a.control, profile = _a.profile;
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { profile: profile })] }));
}
// Possible durations: max 4 hours, 5 minute intervals
var DURATIONS = Array.from({ length: (4 * 60) / 5 }).map(function (_, i) { return (i + 1) * 5; });
function DialogInner(_a) {
    var profile = _a.profile;
    var control = Dialog.useDialogContext();
    var _b = useLingui(), _ = _b._, i18n = _b.i18n;
    var t = useTheme();
    var _c = useState(''), liveLink = _c[0], setLiveLink = _c[1];
    var _d = useState(''), liveLinkError = _d[0], setLiveLinkError = _d[1];
    var _e = useState(60), duration = _e[0], setDuration = _e[1];
    var moderationOpts = useModerationOpts();
    var tick = useTickEveryMinute();
    var liveNowConfig = useLiveNowConfig();
    var allowedServices = getLiveServiceNames(liveNowConfig.currentAccountAllowedHosts).formatted;
    var time = useCallback(function (offset) {
        void tick;
        var date = new Date();
        date.setMinutes(date.getMinutes() + offset);
        return i18n.date(date, { hour: 'numeric', minute: '2-digit', hour12: true });
    }, [tick, i18n]);
    var onChangeDuration = useCallback(function (newDuration) {
        setDuration(Number(newDuration));
    }, []);
    var liveLinkUrl = definitelyUrl(liveLink);
    var debouncedUrl = useDebouncedValue(liveLinkUrl, 500);
    var _f = useLiveLinkMetaQuery(debouncedUrl), linkMeta = _f.data, hasValidLinkMeta = _f.isSuccess, linkMetaLoading = _f.isLoading, linkMetaError = _f.error;
    var _g = useUpsertLiveStatusMutation(duration, linkMeta), goLive = _g.mutate, isGoingLive = _g.isPending, goLiveError = _g.error;
    var isSourceInvalid = !!liveLinkError || !!linkMetaError;
    var hasLink = !!debouncedUrl && !isSourceInvalid;
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go Live"], ["Go Live"])))), style: web({ maxWidth: 420 }), children: [_jsxs(View, { style: [a.gap_xl], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_2xl], children: _jsx(Trans, { children: "Go Live" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Add a temporary live status to your profile. When someone clicks on your avatar, they\u2019ll see information about your live event." }) })] }), moderationOpts && (_jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, liveOverride: true, disabledPreview: true }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts })] })), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Live link" }) }), _jsx(TextField.Root, { isInvalid: isSourceInvalid, children: _jsx(TextField.Input, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Live link"], ["Live link"])))), placeholder: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["www.mylivestream.tv"], ["www.mylivestream.tv"])))), value: liveLink, onChangeText: setLiveLink, onFocus: function () { return setLiveLinkError(''); }, onBlur: function () {
                                                if (!definitelyUrl(liveLink)) {
                                                    setLiveLinkError('Invalid URL');
                                                }
                                            }, returnKeyType: "done", autoCapitalize: "none", autoComplete: "url", autoCorrect: false }) })] }), liveLinkError || linkMetaError ? (_jsx(Admonition, { type: "error", children: liveLinkError ? (_jsx(Trans, { children: "This is not a valid link" })) : (cleanError(linkMetaError)) })) : (_jsx(Admonition, { type: "tip", children: _jsxs(Trans, { children: ["The following services are enabled for your account:", ' ', allowedServices] }) })), _jsx(LinkPreview, { linkMeta: linkMeta, loading: linkMetaLoading })] }), hasLink && (_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Go live for" }) }), _jsxs(Select.Root, { value: String(duration), onValueChange: onChangeDuration, children: [_jsxs(Select.Trigger, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Select duration"], ["Select duration"])))), children: [_jsxs(Text, { style: [ios(a.py_xs)], children: [displayDuration(i18n, duration), '  ', _jsx(Text, { style: [t.atoms.text_contrast_low], children: time(duration) })] }), _jsx(Select.Icon, {})] }), _jsx(Select.Content, { renderItem: function (item, _i, selectedValue) {
                                            var label = displayDuration(i18n, item);
                                            return (_jsxs(Select.Item, { value: String(item), label: label, children: [_jsx(Select.ItemIndicator, {}), _jsxs(Select.ItemText, { children: [label, '  ', _jsx(Text, { style: [
                                                                    native(a.text_md),
                                                                    web(a.ml_xs),
                                                                    selectedValue === String(item)
                                                                        ? t.atoms.text_contrast_medium
                                                                        : t.atoms.text_contrast_low,
                                                                    a.font_normal,
                                                                ], children: time(item) })] })] }));
                                        }, items: DURATIONS, valueExtractor: function (d) { return String(d); } })] })] })), goLiveError && (_jsx(Admonition, { type: "error", children: cleanError(goLiveError) })), _jsxs(View, { style: platform({
                            native: [a.gap_md, a.pt_lg],
                            web: [a.flex_row_reverse, a.gap_md, a.align_center],
                        }), children: [hasLink && (_jsxs(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Go Live"], ["Go Live"])))), size: platform({ native: 'large', web: 'small' }), color: "primary", variant: "solid", onPress: function () { return goLive(); }, disabled: isGoingLive || !hasValidLinkMeta || debouncedUrl !== liveLinkUrl, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Go Live" }) }), isGoingLive && _jsx(ButtonIcon, { icon: Loader })] })), _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: function () { return control.close(); }, size: platform({ native: 'large', web: 'small' }), color: "secondary", variant: platform({ native: 'solid', web: 'ghost' }), children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) })] })] }), _jsx(Dialog.Close, {})] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
