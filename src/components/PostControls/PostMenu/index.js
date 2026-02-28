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
import { memo, useMemo, useState } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { EventStopper } from '#/view/com/util/EventStopper';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import { useMenuControl } from '#/components/Menu';
import * as Menu from '#/components/Menu';
import { PostControlButton, PostControlButtonIcon } from '../PostControlButton';
import { PostMenuItems } from './PostMenuItems';
var PostMenuButton = function (_a) {
    var testID = _a.testID, post = _a.post, postFeedContext = _a.postFeedContext, postReqId = _a.postReqId, big = _a.big, record = _a.record, richText = _a.richText, timestamp = _a.timestamp, threadgateRecord = _a.threadgateRecord, onShowLess = _a.onShowLess, hitSlop = _a.hitSlop, logContext = _a.logContext;
    var _ = useLingui()._;
    var menuControl = useMenuControl();
    var _b = useState(false), hasBeenOpen = _b[0], setHasBeenOpen = _b[1];
    var lazyMenuControl = useMemo(function () { return (__assign(__assign({}, menuControl), { open: function () {
            setHasBeenOpen(true);
            // HACK. We need the state update to be flushed by the time
            // menuControl.open() fires but RN doesn't expose flushSync.
            setTimeout(menuControl.open);
        } })); }, [menuControl, setHasBeenOpen]);
    return (_jsx(EventStopper, { onKeyDown: false, children: _jsxs(Menu.Root, { control: lazyMenuControl, children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Open post options menu"], ["Open post options menu"])))), children: function (_a) {
                        var props = _a.props;
                        return (_jsx(PostControlButton, __assign({ testID: "postDropdownBtn", big: big, label: props.accessibilityLabel }, props, { hitSlop: hitSlop, children: _jsx(PostControlButtonIcon, { icon: DotsHorizontal }) })));
                    } }), hasBeenOpen && (
                // Lazily initialized. Once mounted, they stay mounted.
                _jsx(PostMenuItems, { testID: testID, post: post, postFeedContext: postFeedContext, postReqId: postReqId, record: record, richText: richText, timestamp: timestamp, threadgateRecord: threadgateRecord, onShowLess: onShowLess, logContext: logContext }))] }) }));
};
PostMenuButton = memo(PostMenuButton);
export { PostMenuButton };
var templateObject_1;
