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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Trans } from '@lingui/react/macro';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { atoms as a, useTheme } from '#/alf';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
export function createSuggestion(_a) {
    var autocomplete = _a.autocomplete, autocompleteRef = _a.autocompleteRef;
    return {
        items: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var suggestions;
                var query = _b.query;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, autocomplete({ query: query })];
                        case 1:
                            suggestions = _c.sent();
                            return [2 /*return*/, suggestions.slice(0, 8)];
                    }
                });
            });
        },
        render: function () {
            var component;
            var popup;
            var hide = function () {
                var _a;
                (_a = popup === null || popup === void 0 ? void 0 : popup[0]) === null || _a === void 0 ? void 0 : _a.destroy();
                component === null || component === void 0 ? void 0 : component.destroy();
            };
            return {
                onStart: function (props) {
                    component = new ReactRenderer(MentionList, {
                        props: __assign(__assign({}, props), { autocompleteRef: autocompleteRef, hide: hide }),
                        editor: props.editor,
                    });
                    if (!props.clientRect) {
                        return;
                    }
                    // @ts-ignore getReferenceClientRect doesnt like that clientRect can return null -prf
                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: function () { return document.body; },
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },
                onUpdate: function (props) {
                    var _a;
                    component === null || component === void 0 ? void 0 : component.updateProps(props);
                    if (!props.clientRect) {
                        return;
                    }
                    (_a = popup === null || popup === void 0 ? void 0 : popup[0]) === null || _a === void 0 ? void 0 : _a.setProps({
                        // @ts-ignore getReferenceClientRect doesnt like that clientRect can return null -prf
                        getReferenceClientRect: props.clientRect,
                    });
                },
                onKeyDown: function (props) {
                    var _a;
                    if (props.event.key === 'Escape') {
                        return false;
                    }
                    return ((_a = component === null || component === void 0 ? void 0 : component.ref) === null || _a === void 0 ? void 0 : _a.onKeyDown(props)) || false;
                },
                onExit: function () {
                    hide();
                },
            };
        },
    };
}
var MentionList = forwardRef(function MentionListImpl(_a, ref) {
    var items = _a.items, command = _a.command, hide = _a.hide, autocompleteRef = _a.autocompleteRef;
    var _b = useState(0), selectedIndex = _b[0], setSelectedIndex = _b[1];
    var t = useTheme();
    var moderationOpts = useModerationOpts();
    var selectItem = function (index) {
        var item = items[index];
        if (item) {
            command({ id: item.handle });
        }
    };
    var upHandler = function () {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };
    var downHandler = function () {
        setSelectedIndex((selectedIndex + 1) % items.length);
    };
    var enterHandler = function () {
        selectItem(selectedIndex);
    };
    useEffect(function () { return setSelectedIndex(0); }, [items]);
    useImperativeHandle(autocompleteRef, function () { return ({
        maybeClose: function () {
            hide();
            return true;
        },
    }); });
    useImperativeHandle(ref, function () { return ({
        onKeyDown: function (_a) {
            var event = _a.event;
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                enterHandler();
                return true;
            }
            return false;
        },
    }); });
    if (!moderationOpts)
        return null;
    return (_jsx("div", { className: "items", children: _jsx(View, { style: [
                t.atoms.border_contrast_low,
                t.atoms.bg,
                a.rounded_sm,
                a.border,
                a.p_xs,
                { width: 300 },
            ], children: items.length > 0 ? (items.map(function (item, index) {
                var isSelected = selectedIndex === index;
                return (_jsx(AutocompleteProfileCard, { profile: item, isSelected: isSelected, onPress: function () { return selectItem(index); }, onHover: function () { return setSelectedIndex(index); }, moderationOpts: moderationOpts }, item.handle));
            })) : (_jsx(Text, { style: [a.text_sm, a.px_md, a.py_md], children: _jsx(Trans, { children: "No result" }) })) }) }));
});
function AutocompleteProfileCard(_a) {
    var profile = _a.profile, isSelected = _a.isSelected, onPress = _a.onPress, onHover = _a.onHover, moderationOpts = _a.moderationOpts;
    var t = useTheme();
    return (_jsx(Pressable, { style: [
            isSelected && t.atoms.bg_contrast_25,
            a.align_center,
            a.justify_between,
            a.flex_row,
            a.px_md,
            a.py_sm,
            a.gap_2xl,
            a.rounded_xs,
            a.transition_color,
        ], onPress: onPress, onPointerEnter: onHover, accessibilityRole: "button", children: _jsx(View, { style: [a.flex_1], children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts, disabledPreview: true }), _jsx(ProfileCard.NameAndHandle, { profile: profile, moderationOpts: moderationOpts })] }) }) }));
}
