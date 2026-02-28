var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useMemo } from 'react';
import * as ExpoClipboard from 'expo-clipboard';
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
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { useDialogControl } from '#/components/Dialog';
import { SendViaChatDialog } from '#/components/dms/dialogs/ShareViaChatDialog';
import { ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon } from '#/components/icons/ArrowOutOfBox';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon } from '#/components/icons/ChainLink';
import { Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon } from '#/components/icons/Clipboard';
import { PaperPlane_Stroke2_Corner0_Rounded as PaperPlaneIcon } from '#/components/icons/PaperPlane';
import * as Menu from '#/components/Menu';
import { useAgeAssurance } from '#/ageAssurance';
import { useAnalytics } from '#/analytics';
import { IS_IOS } from '#/env';
import { useDevMode } from '#/storage/hooks/dev-mode';
import { RecentChats } from './RecentChats';
var ShareMenuItems = function (_a) {
    var post = _a.post, onShareProp = _a.onShare;
    var ax = useAnalytics();
    var hasSession = useSession().hasSession;
    var _ = useLingui()._;
    var navigation = useNavigation();
    var sendViaChatControl = useDialogControl();
    var devModeEnabled = useDevMode()[0];
    var aa = useAgeAssurance();
    var postUri = post.uri;
    var postAuthor = useProfileShadow(post.author);
    var href = useMemo(function () {
        var urip = new AtUri(postUri);
        return makeProfileLink(postAuthor, 'post', urip.rkey);
    }, [postUri, postAuthor]);
    var hideInPWI = useMemo(function () {
        var _a;
        return !!((_a = postAuthor.labels) === null || _a === void 0 ? void 0 : _a.find(function (label) { return label.val === '!no-unauthenticated'; }));
    }, [postAuthor]);
    var onSharePost = function () {
        ax.metric('share:press:nativeShare', {});
        var url = toShareUrl(href);
        shareUrl(url);
        onShareProp();
    };
    var onCopyLink = function () { return __awaiter(void 0, void 0, void 0, function () {
        var url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ax.metric('share:press:copyLink', {});
                    url = toShareUrl(href);
                    if (!IS_IOS) return [3 /*break*/, 2];
                    // iOS only
                    return [4 /*yield*/, ExpoClipboard.setUrlAsync(url)];
                case 1:
                    // iOS only
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ExpoClipboard.setStringAsync(url)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Copied to clipboard"], ["Copied to clipboard"])))), 'clipboard-check');
                    onShareProp();
                    return [2 /*return*/];
            }
        });
    }); };
    var onSelectChatToShareTo = function (conversation) {
        navigation.navigate('MessagesConversation', {
            conversation: conversation,
            embed: postUri,
        });
    };
    var onShareATURI = function () {
        shareText(postUri);
    };
    var onShareAuthorDID = function () {
        shareText(postAuthor.did);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Menu.Outer, { children: [hasSession && aa.state.access === aa.Access.Full && (_jsxs(Menu.Group, { children: [_jsx(Menu.ContainerItem, { children: _jsx(RecentChats, { postUri: postUri }) }), _jsxs(Menu.Item, { testID: "postDropdownSendViaDMBtn", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Send via direct message"], ["Send via direct message"])))), onPress: function () {
                                    ax.metric('share:press:openDmSearch', {});
                                    sendViaChatControl.open();
                                }, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Send via direct message" }) }), _jsx(Menu.ItemIcon, { icon: PaperPlaneIcon, position: "right" })] })] })), _jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { testID: "postDropdownShareBtn", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Share via..."], ["Share via..."])))), onPress: onSharePost, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Share via..." }) }), _jsx(Menu.ItemIcon, { icon: ArrowOutOfBoxIcon, position: "right" })] }), _jsxs(Menu.Item, { testID: "postDropdownShareBtn", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Copy link to post"], ["Copy link to post"])))), onPress: onCopyLink, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Copy link to post" }) }), _jsx(Menu.ItemIcon, { icon: ChainLinkIcon, position: "right" })] })] }), hideInPWI && (_jsx(Menu.Group, { children: _jsx(Menu.ContainerItem, { children: _jsx(Admonition, { type: "warning", style: [a.flex_1, a.border_0, a.p_0, a.bg_transparent], children: _jsx(Trans, { children: "This post is only visible to logged-in users." }) }) }) })), devModeEnabled && (_jsxs(Menu.Group, { children: [_jsxs(Menu.Item, { testID: "postAtUriShareBtn", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Share post at:// URI"], ["Share post at:// URI"])))), onPress: onShareATURI, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Share post at:// URI" }) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon, position: "right" })] }), _jsxs(Menu.Item, { testID: "postAuthorDIDShareBtn", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Share author DID"], ["Share author DID"])))), onPress: onShareAuthorDID, children: [_jsx(Menu.ItemText, { children: _jsx(Trans, { children: "Share author DID" }) }), _jsx(Menu.ItemIcon, { icon: ClipboardIcon, position: "right" })] })] }))] }), _jsx(SendViaChatDialog, { control: sendViaChatControl, onSelectChat: onSelectChatToShareTo })] }));
};
ShareMenuItems = memo(ShareMenuItems);
export { ShareMenuItems };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
