var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import deepEqual from 'fast-deep-equal';
import { isNetworkError } from '#/lib/strings/errors';
import { logger } from '#/logger';
import { usePostInteractionSettingsMutation } from '#/state/queries/post-interaction-settings';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { threadgateAllowUISettingToAllowRecordValue, threadgateRecordToAllowUISetting, } from '#/state/queries/threadgate';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { PostInteractionSettingsControlledDialog } from '#/components/dialogs/PostInteractionSettingsDialog';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon } from '#/components/icons/Chevron';
import { Earth_Stroke2_Corner0_Rounded as EarthIcon } from '#/components/icons/Globe';
import { Group3_Stroke2_Corner0_Rounded as GroupIcon } from '#/components/icons/Group';
import * as Tooltip from '#/components/Tooltip';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { useThreadgateNudged } from '#/storage/hooks/threadgate-nudged';
export function ThreadgateBtn(_a) {
    var _b;
    var postgate = _a.postgate, onChangePostgate = _a.onChangePostgate, threadgateAllowUISettings = _a.threadgateAllowUISettings, onChangeThreadgateAllowUISettings = _a.onChangeThreadgateAllowUISettings;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var control = Dialog.useDialogControl();
    var _c = useThreadgateNudged(), threadgateNudged = _c[0], setThreadgateNudged = _c[1];
    var _d = useState(false), showTooltip = _d[0], setShowTooltip = _d[1];
    var tooltipWasShown = useState(!threadgateNudged)[0];
    useEffect(function () {
        if (!threadgateNudged) {
            var timeout_1 = setTimeout(function () {
                setShowTooltip(true);
            }, 1000);
            return function () { return clearTimeout(timeout_1); };
        }
    }, [threadgateNudged]);
    var onDismissTooltip = function (visible) {
        if (visible)
            return;
        setThreadgateNudged(true);
        setShowTooltip(false);
    };
    var preferences = usePreferencesQuery().data;
    var _e = useState(false), persist = _e[0], setPersist = _e[1];
    var onPress = function () {
        ax.metric('composer:threadgate:open', {
            nudged: tooltipWasShown,
        });
        if (IS_NATIVE && Keyboard.isVisible()) {
            Keyboard.dismiss();
        }
        setShowTooltip(false);
        setThreadgateNudged(true);
        control.open();
    };
    var prefThreadgateAllowUISettings = threadgateRecordToAllowUISetting({
        $type: 'app.bsky.feed.threadgate',
        post: '',
        createdAt: new Date().toISOString(),
        allow: preferences === null || preferences === void 0 ? void 0 : preferences.postInteractionSettings.threadgateAllowRules,
    });
    var prefPostgate = createPostgateRecord({
        post: '',
        embeddingRules: ((_b = preferences === null || preferences === void 0 ? void 0 : preferences.postInteractionSettings) === null || _b === void 0 ? void 0 : _b.postgateEmbeddingRules) || [],
    });
    var isDirty = useMemo(function () {
        var _a;
        var everybody = [{ type: 'everybody' }];
        return (!deepEqual(threadgateAllowUISettings, prefThreadgateAllowUISettings !== null && prefThreadgateAllowUISettings !== void 0 ? prefThreadgateAllowUISettings : everybody) ||
            !deepEqual(postgate.embeddingRules, (_a = prefPostgate === null || prefPostgate === void 0 ? void 0 : prefPostgate.embeddingRules) !== null && _a !== void 0 ? _a : []));
    }, [
        prefThreadgateAllowUISettings,
        prefPostgate,
        threadgateAllowUISettings,
        postgate,
    ]);
    var _f = usePostInteractionSettingsMutation({
        onError: function (err) {
            if (!isNetworkError(err)) {
                logger.error('Failed to persist threadgate settings', {
                    safeMessage: err,
                });
            }
        },
        onSettled: function () {
            control.close(function () {
                setPersist(false);
            });
        },
    }), persistChanges = _f.mutate, isSaving = _f.isPending;
    var anyoneCanReply = threadgateAllowUISettings.length === 1 &&
        threadgateAllowUISettings[0].type === 'everybody';
    var anyoneCanQuote = !postgate.embeddingRules || postgate.embeddingRules.length === 0;
    var anyoneCanInteract = anyoneCanReply && anyoneCanQuote;
    var label = anyoneCanInteract
        ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Anyone can interact"], ["Anyone can interact"]))))
        : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Interaction limited"], ["Interaction limited"]))));
    return (_jsxs(_Fragment, { children: [_jsxs(Tooltip.Outer, { visible: showTooltip, onVisibleChange: onDismissTooltip, position: "top", children: [_jsx(Tooltip.Target, { children: _jsxs(Button, { color: showTooltip ? 'primary_subtle' : 'secondary', size: "small", testID: "openReplyGateButton", onPress: onPress, label: label, accessibilityHint: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Opens a dialog to choose who can interact with this post"], ["Opens a dialog to choose who can interact with this post"])))), children: [_jsx(ButtonIcon, { icon: anyoneCanInteract ? EarthIcon : GroupIcon }), _jsx(ButtonText, { numberOfLines: 1, children: label }), _jsx(ButtonIcon, { icon: TinyChevronIcon, size: "2xs" })] }) }), _jsx(Tooltip.TextBubble, { children: _jsx(Text, { children: _jsx(Trans, { children: "Psst! You can edit who can interact with this post." }) }) })] }), _jsx(PostInteractionSettingsControlledDialog, { control: control, onSave: function () {
                    var _a;
                    if (persist) {
                        persistChanges({
                            threadgateAllowRules: threadgateAllowUISettingToAllowRecordValue(threadgateAllowUISettings),
                            postgateEmbeddingRules: (_a = postgate.embeddingRules) !== null && _a !== void 0 ? _a : [],
                        });
                    }
                    else {
                        control.close();
                    }
                }, isSaving: isSaving, postgate: postgate, onChangePostgate: onChangePostgate, threadgateAllowUISettings: threadgateAllowUISettings, onChangeThreadgateAllowUISettings: onChangeThreadgateAllowUISettings, isDirty: isDirty, persist: persist, onChangePersist: setPersist })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
