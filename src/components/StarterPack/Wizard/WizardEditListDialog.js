var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useInitialNumToRender } from '#/lib/hooks/useInitialNumToRender';
import { atoms as a, native, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { WizardFeedCard, WizardProfileCard, } from '#/components/StarterPack/Wizard/WizardListCard';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
function keyExtractor(item, index) {
    return "".concat(item.did, "-").concat(index);
}
export function WizardEditListDialog(_a) {
    var control = _a.control, state = _a.state, dispatch = _a.dispatch, moderationOpts = _a.moderationOpts, profile = _a.profile;
    var _ = useLingui()._;
    var t = useTheme();
    var initialNumToRender = useInitialNumToRender();
    var listRef = useRef(null);
    var getData = function () {
        if (state.currentStep === 'Feeds')
            return state.feeds;
        return __spreadArray([profile], state.profiles.filter(function (p) { return p.did !== profile.did; }), true);
    };
    var renderItem = function (_a) {
        var item = _a.item;
        return state.currentStep === 'Profiles' ? (_jsx(WizardProfileCard, { profile: item, btnType: "remove", state: state, dispatch: dispatch, moderationOpts: moderationOpts })) : (_jsx(WizardFeedCard, { generator: item, btnType: "remove", state: state, dispatch: dispatch, moderationOpts: moderationOpts }));
    };
    return (_jsxs(Dialog.Outer, { control: control, testID: "newChatDialog", children: [_jsx(Dialog.Handle, {}), _jsx(Dialog.InnerFlatList, { ref: listRef, data: getData(), renderItem: renderItem, keyExtractor: keyExtractor, ListHeaderComponent: _jsxs(View, { style: [
                        native(a.pt_4xl),
                        a.flex_row,
                        a.justify_between,
                        a.border_b,
                        a.px_sm,
                        a.mb_sm,
                        t.atoms.bg,
                        t.atoms.border_contrast_medium,
                        IS_WEB
                            ? [
                                a.align_center,
                                {
                                    height: 48,
                                },
                            ]
                            : [a.pb_sm, a.align_end],
                    ], children: [_jsx(View, { style: { width: 60 } }), _jsx(Text, { style: [a.font_semi_bold, a.text_xl], children: state.currentStep === 'Profiles' ? (_jsx(Trans, { children: "Edit People" })) : (_jsx(Trans, { children: "Edit Feeds" })) }), _jsx(View, { style: { width: 60 }, children: IS_WEB && (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close"], ["Close"])))), variant: "ghost", color: "primary", size: "small", onPress: function () { return control.close(); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })) })] }), stickyHeaderIndices: [0], style: [
                    web([a.py_0, { height: '100vh', maxHeight: 600 }, a.px_0]),
                    native({
                        height: '100%',
                        paddingHorizontal: 0,
                        marginTop: 0,
                        paddingTop: 0,
                    }),
                ], webInnerStyle: [a.py_0, { maxWidth: 500, minWidth: 200 }], keyboardDismissMode: "on-drag", removeClippedSubviews: true, initialNumToRender: initialNumToRender })] }));
}
var templateObject_1;
