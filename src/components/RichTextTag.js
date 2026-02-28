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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Text as RNText } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { isInvalidHandle } from '#/lib/strings/handles';
import { usePreferencesQuery, useRemoveMutedWordsMutation, useUpsertMutedWordsMutation, } from '#/state/queries/preferences';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as Search } from '#/components/icons/MagnifyingGlass';
import { Mute_Stroke2_Corner0_Rounded as Mute } from '#/components/icons/Mute';
import { Person_Stroke2_Corner0_Rounded as Person } from '#/components/icons/Person';
import { createStaticClick, createStaticClickIfUnmodified, InlineLinkText, } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Menu from '#/components/Menu';
import { IS_NATIVE, IS_WEB } from '#/env';
export function RichTextTag(_a) {
    var _b, _c, _d;
    var tag = _a.tag, display = _a.display, authorHandle = _a.authorHandle, textStyle = _a.textStyle;
    var _ = useLingui()._;
    var _e = usePreferencesQuery(), isPreferencesLoading = _e.isLoading, preferences = _e.data;
    var _f = useUpsertMutedWordsMutation(), upsertMutedWord = _f.mutateAsync, optimisticUpsert = _f.variables, resetUpsert = _f.reset;
    var _g = useRemoveMutedWordsMutation(), removeMutedWords = _g.mutateAsync, optimisticRemove = _g.variables, resetRemove = _g.reset;
    var navigation = useNavigation();
    var isCashtag = tag.startsWith('$');
    var label = isCashtag ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Cashtag ", ""], ["Cashtag ", ""])), tag)) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Hashtag ", ""], ["Hashtag ", ""])), tag));
    var hint = IS_NATIVE
        ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Long press to open tag menu for ", ""], ["Long press to open tag menu for ", ""])), isCashtag ? tag : "#".concat(tag)))
        : _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Click to open tag menu for ", ""], ["Click to open tag menu for ", ""])), isCashtag ? tag : "#".concat(tag)));
    var isMuted = Boolean(((_c = (_b = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.mutedWords) === null || _b === void 0 ? void 0 : _b.find(function (m) { return m.value === tag && m.targets.includes('tag'); })) !== null && _c !== void 0 ? _c : optimisticUpsert === null || optimisticUpsert === void 0 ? void 0 : optimisticUpsert.find(function (m) { return m.value === tag && m.targets.includes('tag'); })) &&
        !(optimisticRemove === null || optimisticRemove === void 0 ? void 0 : optimisticRemove.find(function (m) { return (m === null || m === void 0 ? void 0 : m.value) === tag; })));
    /*
     * Mute word records that exactly match the tag in question.
     */
    var removeableMuteWords = React.useMemo(function () {
        var _a;
        return (((_a = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs.mutedWords) === null || _a === void 0 ? void 0 : _a.filter(function (word) {
            return word.value === tag;
        })) || []);
    }, [tag, (_d = preferences === null || preferences === void 0 ? void 0 : preferences.moderationPrefs) === null || _d === void 0 ? void 0 : _d.mutedWords]);
    return (_jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: label, hint: hint, children: function (_a) {
                    var menuProps = _a.props;
                    return (_jsx(InlineLinkText, __assign({ to: {
                            screen: 'Hashtag',
                            params: { tag: encodeURIComponent(tag) },
                        } }, menuProps, { onPress: function (e) {
                            if (IS_WEB) {
                                return createStaticClickIfUnmodified(function () {
                                    if (!IS_NATIVE) {
                                        menuProps.onPress();
                                    }
                                }).onPress(e);
                            }
                        }, onLongPress: createStaticClick(menuProps.onPress).onPress, accessibilityHint: hint, label: label, style: textStyle, emoji: true, children: IS_NATIVE ? (display) : (_jsx(RNText, { ref: menuProps.ref, children: display })) })));
                } }), _jsxs(Menu.Outer, { children: [_jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["See ", " posts"], ["See ", " posts"])), isCashtag ? tag : "#".concat(tag))), onPress: function () {
                                    navigation.push('Hashtag', {
                                        tag: encodeURIComponent(tag),
                                    });
                                }, children: [_jsx(Menu.ItemText, { children: isCashtag ? (_jsxs(Trans, { children: ["See ", tag, " posts"] })) : (_jsxs(Trans, { children: ["See #", tag, " posts"] })) }), _jsx(Menu.ItemIcon, { icon: Search })] }), authorHandle && !isInvalidHandle(authorHandle) && (_jsxs(Menu.Item, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["See ", " posts by user"], ["See ", " posts by user"])), isCashtag ? tag : "#".concat(tag))), onPress: function () {
                                    navigation.push('Hashtag', {
                                        tag: encodeURIComponent(tag),
                                        author: authorHandle,
                                    });
                                }, children: [_jsx(Menu.ItemText, { children: isCashtag ? (_jsxs(Trans, { children: ["See ", tag, " posts by user"] })) : (_jsxs(Trans, { children: ["See #", tag, " posts by user"] })) }), _jsx(Menu.ItemIcon, { icon: Person })] }))] }), _jsx(Menu.Divider, {}), _jsxs(Menu.Item, { label: isMuted
                            ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Unmute ", ""], ["Unmute ", ""])), isCashtag ? tag : "#".concat(tag)))
                            : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Mute ", ""], ["Mute ", ""])), isCashtag ? tag : "#".concat(tag))), onPress: function () {
                            if (isMuted) {
                                resetUpsert();
                                removeMutedWords(removeableMuteWords);
                            }
                            else {
                                resetRemove();
                                upsertMutedWord([
                                    { value: tag, targets: ['tag'], actorTarget: 'all' },
                                ]);
                            }
                        }, children: [_jsx(Menu.ItemText, { children: isMuted
                                    ? _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Unmute ", ""], ["Unmute ", ""])), isCashtag ? tag : "#".concat(tag)))
                                    : _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Mute ", ""], ["Mute ", ""])), isCashtag ? tag : "#".concat(tag))) }), _jsx(Menu.ItemIcon, { icon: isPreferencesLoading ? Loader : Mute })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
