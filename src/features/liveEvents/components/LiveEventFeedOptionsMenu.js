var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { atoms as a, web } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Span, Text } from '#/components/Typography';
import { IS_NATIVE } from '#/env';
import { useUpdateLiveEventPreferences } from '#/features/liveEvents/preferences';
export { useDialogControl } from '#/components/Dialog';
export function LiveEventFeedOptionsMenu(_a) {
    var control = _a.control, feed = _a.feed, metricContext = _a.metricContext;
    var _ = useLingui()._;
    return (_jsxs(Dialog.Outer, { control: control, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Configure live event banner"], ["Configure live event banner"])))), style: [web({ maxWidth: 400 })], children: [_jsx(Inner, { control: control, feed: feed, metricContext: metricContext }), _jsx(Dialog.Close, {})] })] }));
}
function Inner(_a) {
    var control = _a.control, feed = _a.feed, metricContext = _a.metricContext;
    var _ = useLingui()._;
    var _b = useUpdateLiveEventPreferences({
        feed: feed,
        metricContext: metricContext,
        onUpdateSuccess: function (_a) {
            var undoAction = _a.undoAction;
            Toast.show(_jsxs(Toast.Outer, { children: [_jsx(Toast.Icon, {}), _jsx(Toast.Text, { children: _jsx(Trans, { children: "Your live event preferences have been updated." }) }), undoAction && (_jsx(Toast.Action, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Undo"], ["Undo"])))), onPress: function () {
                            if (undoAction) {
                                update(undoAction);
                            }
                        }, children: _jsx(Trans, { children: "Undo" }) }))] }), { type: 'success' });
            /*
             * If there is no `undoAction`, it means that the action was already
             * undone, and therefore the menu would have been closed prior to the
             * undo happening.
             */
            if (undoAction) {
                control.close();
            }
        },
    }), isPending = _b.isPending, update = _b.mutate, rawError = _b.error, variables = _b.variables;
    var cleanError = useCleanError();
    var error = rawError ? cleanError(rawError) : undefined;
    var isHidingFeed = (variables === null || variables === void 0 ? void 0 : variables.type) === 'hideFeed' && isPending;
    var isHidingAllFeeds = (variables === null || variables === void 0 ? void 0 : variables.type) === 'toggleHideAllFeeds' && isPending;
    return (_jsxs(View, { style: [a.gap_lg], children: [_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.text_2xl, a.font_semi_bold, a.leading_snug], children: _jsx(Trans, { children: "Live event options" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Live events appear occasionally when something exciting is happening. If you'd like, you can hide this particular event, or all events for this placement in your app interface." }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsxs(Trans, { children: ["If you choose to hide all events, you can always re-enable them from", ' ', _jsx(Span, { style: [a.font_semi_bold], children: "Settings \u2192 Content & Media" }), "."] }) })] }), _jsxs(View, { style: [a.gap_sm], children: [_jsxs(Button, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Hide this event"], ["Hide this event"])))), size: "large", color: "primary_subtle", onPress: function () {
                            update({ type: 'hideFeed', id: feed.id });
                        }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Hide this event" }) }), isHidingFeed && _jsx(ButtonIcon, { icon: Loader })] }), _jsxs(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Hide all events"], ["Hide all events"])))), size: "large", color: "secondary", onPress: function () {
                            update({ type: 'toggleHideAllFeeds' });
                        }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Hide all events" }) }), isHidingAllFeeds && _jsx(ButtonIcon, { icon: Loader })] }), IS_NATIVE && (_jsx(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Cancel"], ["Cancel"])))), size: "large", color: "secondary_inverted", onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Cancel" }) }) }))] }), error && (_jsx(Admonition, { type: "error", children: error.clean || error.raw || _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["An unknown error occurred."], ["An unknown error occurred."])))) }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
