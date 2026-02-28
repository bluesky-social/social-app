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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useRequireAuth, useSession } from '#/state/session';
import { EventStopper } from '#/view/com/util/EventStopper';
import { useTheme } from '#/alf';
import { CloseQuote_Stroke2_Corner1_Rounded as Quote } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as Repost } from '#/components/icons/Repost';
import * as Menu from '#/components/Menu';
import { PostControlButton, PostControlButtonIcon, PostControlButtonText, } from './PostControlButton';
import { useFormatPostStatCount } from './util';
export var RepostButton = function (_a) {
    var isReposted = _a.isReposted, repostCount = _a.repostCount, onRepost = _a.onRepost, onQuote = _a.onQuote, big = _a.big, embeddingDisabled = _a.embeddingDisabled;
    var t = useTheme();
    var _ = useLingui()._;
    var hasSession = useSession().hasSession;
    var requireAuth = useRequireAuth();
    var formatPostStatCount = useFormatPostStatCount();
    return hasSession ? (_jsx(EventStopper, { onKeyDown: false, children: _jsxs(Menu.Root, { children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Repost or quote post"], ["Repost or quote post"])))), children: function (_a) {
                        var props = _a.props;
                        return (_jsxs(PostControlButton, __assign({ testID: "repostBtn", active: isReposted, activeColor: t.palette.positive_500, label: props.accessibilityLabel, big: big }, props, { children: [_jsx(PostControlButtonIcon, { icon: Repost }), typeof repostCount !== 'undefined' && repostCount > 0 && (_jsx(PostControlButtonText, { testID: "repostCount", children: formatPostStatCount(repostCount) }))] })));
                    } }), _jsxs(Menu.Outer, { style: { minWidth: 170 }, children: [_jsxs(Menu.Item, { label: isReposted
                                ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Undo repost"], ["Undo repost"]))))
                                : _(msg({ message: "Repost", context: "action" })), testID: "repostDropdownRepostBtn", onPress: onRepost, children: [_jsx(Menu.ItemText, { children: isReposted
                                        ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Undo repost"], ["Undo repost"]))))
                                        : _(msg({ message: "Repost", context: "action" })) }), _jsx(Menu.ItemIcon, { icon: Repost, position: "right" })] }), _jsxs(Menu.Item, { disabled: embeddingDisabled, label: embeddingDisabled
                                ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Quote posts disabled"], ["Quote posts disabled"]))))
                                : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Quote post"], ["Quote post"])))), testID: "repostDropdownQuoteBtn", onPress: onQuote, children: [_jsx(Menu.ItemText, { children: embeddingDisabled
                                        ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Quote posts disabled"], ["Quote posts disabled"]))))
                                        : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Quote post"], ["Quote post"])))) }), _jsx(Menu.ItemIcon, { icon: Quote, position: "right" })] })] })] }) })) : (_jsxs(PostControlButton, { onPress: function () { return requireAuth(function () { }); }, active: isReposted, activeColor: t.palette.positive_500, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Repost or quote post"], ["Repost or quote post"])))), big: big, children: [_jsx(PostControlButtonIcon, { icon: Repost }), typeof repostCount !== 'undefined' && repostCount > 0 && (_jsx(PostControlButtonText, { testID: "repostCount", children: formatPostStatCount(repostCount) }))] }));
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
