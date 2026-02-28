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
import { AtUri, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { makeProfileLink } from '#/lib/routes/links';
import { shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { EventStopper } from '#/view/com/util/EventStopper';
import { native } from '#/alf';
import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import { useMenuControl } from '#/components/Menu';
import * as Menu from '#/components/Menu';
import { useAnalytics } from '#/analytics';
import { PostControlButton, PostControlButtonIcon } from '../PostControlButton';
import { ShareMenuItems } from './ShareMenuItems';
var ShareMenuButton = function (_a) {
    var testID = _a.testID, post = _a.post, big = _a.big, record = _a.record, richText = _a.richText, timestamp = _a.timestamp, threadgateRecord = _a.threadgateRecord, onShare = _a.onShare, hitSlop = _a.hitSlop, logContext = _a.logContext;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var feedDescriptor = useFeedFeedbackContext().feedDescriptor;
    var menuControl = useMenuControl();
    var _b = useState(false), hasBeenOpen = _b[0], setHasBeenOpen = _b[1];
    var lazyMenuControl = useMemo(function () { return (__assign(__assign({}, menuControl), { open: function () {
            setHasBeenOpen(true);
            // HACK. We need the state update to be flushed by the time
            // menuControl.open() fires but RN doesn't expose flushSync.
            setTimeout(menuControl.open);
            ax.metric('post:share', {
                uri: post.uri,
                authorDid: post.author.did,
                logContext: logContext,
                feedDescriptor: feedDescriptor,
                postContext: big ? 'thread' : 'feed',
            });
        } })); }, [
        ax,
        menuControl,
        setHasBeenOpen,
        big,
        logContext,
        feedDescriptor,
        post.uri,
        post.author.did,
    ]);
    var onNativeLongPress = function () {
        ax.metric('share:press:nativeShare', {});
        var urip = new AtUri(post.uri);
        var href = makeProfileLink(post.author, 'post', urip.rkey);
        var url = toShareUrl(href);
        shareUrl(url);
        onShare();
    };
    return (_jsx(EventStopper, { onKeyDown: false, children: _jsxs(Menu.Root, { control: lazyMenuControl, children: [_jsx(Menu.Trigger, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Open share menu"], ["Open share menu"])))), children: function (_a) {
                        var props = _a.props;
                        return (_jsx(PostControlButton, __assign({ testID: "postShareBtn", big: big, label: props.accessibilityLabel }, props, { onLongPress: native(onNativeLongPress), hitSlop: hitSlop, children: _jsx(PostControlButtonIcon, { icon: ArrowShareRightIcon }) })));
                    } }), hasBeenOpen && (
                // Lazily initialized. Once mounted, they stay mounted.
                _jsx(ShareMenuItems, { testID: testID, post: post, record: record, richText: richText, timestamp: timestamp, threadgateRecord: threadgateRecord, onShare: onShare }))] }) }));
};
ShareMenuButton = memo(ShareMenuButton);
export { ShareMenuButton };
var templateObject_1;
