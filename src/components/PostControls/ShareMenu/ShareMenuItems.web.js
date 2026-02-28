var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useMemo } from 'react';
import { AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { makeProfileLink } from '#/lib/routes/links';
import { shareText, shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useSession } from '#/state/session';
import { useBreakpoints } from '#/alf';
import { useDialogControl } from '#/components/Dialog';
import { EmbedDialog } from '#/components/dialogs/Embed';
import { SendViaChatDialog } from '#/components/dms/dialogs/ShareViaChatDialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { CodeBrackets_Stroke2_Corner0_Rounded as CodeBracketsIcon } from '#/components/icons/CodeBrackets';
import { PaperPlane_Stroke2_Corner0_Rounded as Send } from '#/components/icons/PaperPlane';
import * as Menu from '#/components/Menu';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { useDevMode } from '#/storage/hooks/dev-mode';
var ShareMenuItems = function (_a) {
    var post = _a.post, record = _a.record, timestamp = _a.timestamp, onShareProp = _a.onShare;
    var ax = useAnalytics();
    var hasSession = useSession().hasSession;
    var gtMobile = useBreakpoints().gtMobile;
    var _ = useLingui()._;
    var navigation = useNavigation();
    var embedPostControl = useDialogControl();
    var sendViaChatControl = useDialogControl();
    var devModeEnabled = useDevMode()[0];
    var aa = useAgeAssurance();
    var postUri = post.uri;
    var postCid = post.cid;
    var postAuthor = useProfileShadow(post.author);
    var href = useMemo(function () {
        var urip = new AtUri(postUri);
        return makeProfileLink(postAuthor, 'post', urip.rkey);
    }, [postUri, postAuthor]);
    var hideInPWI = useMemo(function () {
        var _a;
        return !!((_a = postAuthor.labels) === null || _a === void 0 ? void 0 : _a.find(function (label) { return label.val === '!no-unauthenticated'; }));
    }, [postAuthor]);
    var onCopyLink = function () {
        ax.metric('share:press:copyLink', {});
        var url = toShareUrl(href);
        shareUrl(url);
        onShareProp();
    };
    var onSelectChatToShareTo = function (conversation) {
        ax.metric('share:press:dmSelected', {});
        navigation.navigate('MessagesConversation', {
            conversation: conversation,
            embed: postUri,
        });
    };
    var canEmbed = IS_WEB && gtMobile && !hideInPWI;
    var onShareATURI = function () {
        shareText(postUri);
    };
    var onShareAuthorDID = function () {
        shareText(postAuthor.did);
    };
    var copyLinkItem = (_jsxs(Menu.Item, { testID: "postDropdownShareBtn", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Copy link to post"], ["Copy link to post"])))), onPress: onCopyLink, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Copy link to post" }) }), _jsx(Menu.ItemIcon, { icon: ChainLinkIcon, position: "right" })] }));
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Outer, { children: [!hideInPWI && copyLinkItem, hasSession && aa.state.access === aa.Access.Full && (_jsxs(Menu.Item, { testID: "postDropdownSendViaDMBtn", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Send via direct message"], ["Send via direct message"])))), onPress: function () {
                            ax.metric('share:press:openDmSearch', {});
                            sendViaChatControl.open();
                        }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Send via direct message" }) }), _jsx(Menu.ItemIcon, { icon: Send, position: "right" })] })), canEmbed && (_jsxs(Menu.Item, { testID: "postDropdownEmbedBtn", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Embed post"], ["Embed post"])))), onPress: function () {
                            ax.metric('share:press:embed', {});
                            embedPostControl.open();
                        }, children: [_jsx(Menu.ItemText, { children: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Embed post"], ["Embed post"])))) }), _jsx(Menu.ItemIcon, { icon: CodeBracketsIcon, position: "right" })] })), hideInPWI && (_jsxs(_Fragment, { children: [hasSession && _jsx(Menu.Divider, {}), copyLinkItem, _jsx(Menu.LabelText, { style: { maxWidth: 220 }, children: _jsx(Trans, { children: "Note: This post is only visible to logged-in users." }) })] })), devModeEnabled && (_jsxs(_Fragment, { children: [_jsx(Menu.Divider, {}), _jsxs(Menu.Item, { testID: "postAtUriShareBtn", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Copy post at:// URI"], ["Copy post at:// URI"])))), onPress: onShareATURI, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Copy post at:// URI" }) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon, position: "right" })] }), _jsxs(Menu.Item, { testID: "postAuthorDIDShareBtn", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Copy author DID"], ["Copy author DID"])))), onPress: onShareAuthorDID, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Copy author DID" }) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon, position: "right" })] })] }))] }), canEmbed && (_jsx(EmbedDialog, { control: embedPostControl, postCid: postCid, postUri: postUri, record: record, postAuthor: postAuthor, timestamp: timestamp })), _jsx(SendViaChatDialog, { control: sendViaChatControl, onSelectChat: onSelectChatToShareTo })] }));
};
ShareMenuItems = memo(ShareMenuItems);
export { ShareMenuItems };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
