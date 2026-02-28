var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { ComAtprotoLabelDefs } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useProfileQuery, useProfileUpdateMutation, } from '#/state/queries/profile';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Typography';
import * as bsky from '#/types/bsky';
export function PwiOptOut() {
    var _a;
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var profile = useProfileQuery({ did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }).data;
    var updateProfile = useProfileUpdateMutation();
    var isOptedOut = ((_a = profile === null || profile === void 0 ? void 0 : profile.labels) === null || _a === void 0 ? void 0 : _a.some(function (l) { return l.val === '!no-unauthenticated'; })) || false;
    var canToggle = profile && !updateProfile.isPending;
    var onToggleOptOut = React.useCallback(function () {
        if (!profile) {
            return;
        }
        var wasAdded = false;
        updateProfile.mutate({
            profile: profile,
            updates: function (existing) {
                // create labels attr if needed
                var labels = bsky.validate(existing.labels, ComAtprotoLabelDefs.validateSelfLabels)
                    ? existing.labels
                    : {
                        $type: 'com.atproto.label.defs#selfLabels',
                        values: [],
                    };
                // toggle the label
                var hasLabel = labels.values.some(function (l) { return l.val === '!no-unauthenticated'; });
                if (hasLabel) {
                    wasAdded = false;
                    labels.values = labels.values.filter(function (l) { return l.val !== '!no-unauthenticated'; });
                }
                else {
                    wasAdded = true;
                    labels.values.push({ val: '!no-unauthenticated' });
                }
                // delete if no longer needed
                if (labels.values.length === 0) {
                    delete existing.labels;
                }
                else {
                    existing.labels = labels;
                }
                return existing;
            },
            checkCommitted: function (res) {
                var _a;
                var exists = !!((_a = res.data.labels) === null || _a === void 0 ? void 0 : _a.some(function (l) { return l.val === '!no-unauthenticated'; }));
                return exists === wasAdded;
            },
        });
    }, [updateProfile, profile]);
    return (_jsxs(View, { style: [a.flex_1, a.gap_sm], children: [_jsxs(Toggle.Item, { name: "logged_out_visibility", disabled: !canToggle || updateProfile.isPending, value: isOptedOut, onChange: onToggleOptOut, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Discourage apps from showing my account to logged-out users"], ["Discourage apps from showing my account to logged-out users"])))), style: [a.w_full], children: [_jsx(Toggle.LabelText, { style: [a.flex_1], children: _jsx(Trans, { children: "Discourage apps from showing my account to logged-out users" }) }), _jsx(Toggle.Platform, {})] }), _jsx(Text, { style: [a.leading_snug, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Bluesky will not show your profile and posts to logged-out users. Other apps may not honor this request. This does not make your account private." }) })] }));
}
var templateObject_1;
