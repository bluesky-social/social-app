var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { Button, ButtonIcon } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon } from '#/components/icons/BellPlus';
import { BellRinging_Filled_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import * as Tooltip from '#/components/Tooltip';
import { Text } from '#/components/Typography';
import { useActivitySubscriptionsNudged } from '#/storage/hooks/activity-subscriptions-nudged';
import { SubscribeProfileDialog } from './SubscribeProfileDialog';
export function SubscribeProfileButton(_a) {
    var _b, _c, _d, _e;
    var profile = _a.profile, moderationOpts = _a.moderationOpts, disableHint = _a.disableHint;
    var _ = useLingui()._;
    var requireEmailVerification = useRequireEmailVerification();
    var subscribeDialogControl = useDialogControl();
    var _f = useActivitySubscriptionsNudged(), activitySubscriptionsNudged = _f[0], setActivitySubscriptionsNudged = _f[1];
    var _g = useState(false), showTooltip = _g[0], setShowTooltip = _g[1];
    useEffect(function () {
        if (!activitySubscriptionsNudged) {
            var timeout_1 = setTimeout(function () {
                setShowTooltip(true);
            }, 500);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [activitySubscriptionsNudged]);
    var onDismissTooltip = function (visible) {
        if (visible)
            return;
        setShowTooltip(false);
        setActivitySubscriptionsNudged(true);
    };
    var onPress = useCallback(function () {
        subscribeDialogControl.open();
    }, [subscribeDialogControl]);
    var name = createSanitizedDisplayName(profile, true);
    var wrappedOnPress = requireEmailVerification(onPress, {
        instructions: [
            _jsxs(Trans, { children: ["Before you can get notifications for ", name, "'s posts, you must first verify your email."] }, "message"),
        ],
    });
    var isSubscribed = ((_c = (_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.activitySubscription) === null || _c === void 0 ? void 0 : _c.post) ||
        ((_e = (_d = profile.viewer) === null || _d === void 0 ? void 0 : _d.activitySubscription) === null || _e === void 0 ? void 0 : _e.reply);
    var Icon = isSubscribed ? BellRingingIcon : BellPlusIcon;
    var tooltipVisible = showTooltip && !disableHint;
    return (_jsxs(_Fragment, { children: [_jsxs(Tooltip.Outer, { visible: tooltipVisible, onVisibleChange: onDismissTooltip, position: "bottom", children: [_jsx(Tooltip.Target, { children: _jsx(Button, { accessibilityRole: "button", testID: "dmBtn", size: "small", color: tooltipVisible ? 'primary_subtle' : 'secondary', shape: "round", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Get notified when ", " posts"], ["Get notified when ", " posts"])), name)), onPress: wrappedOnPress, children: _jsx(ButtonIcon, { icon: Icon, size: "md" }) }) }), _jsx(Tooltip.TextBubble, { children: _jsx(Text, { children: _jsx(Trans, { children: "Get notified about new posts" }) }) })] }), _jsx(SubscribeProfileDialog, { control: subscribeDialogControl, profile: profile, moderationOpts: moderationOpts })] }));
}
var templateObject_1;
