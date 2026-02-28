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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, TouchableOpacity, View, } from 'react-native';
import { AppBskyFeedPost, AppBskyGraphFollow, moderateProfile, } from '@atproto/api';
import { AtUri } from '@atproto/api';
import { TID } from '@atproto/common-web';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { DM_SERVICE_HEADERS, MAX_POST_LINES } from '#/lib/constants';
import { useAnimatedValue } from '#/lib/hooks/useAnimatedValue';
import { usePalette } from '#/lib/hooks/usePalette';
import { makeProfileLink } from '#/lib/routes/links';
import { forceLTR } from '#/lib/strings/bidi';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { niceDate } from '#/lib/strings/time';
import { s } from '#/lib/styles';
import { logger } from '#/logger';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { useAgent, useSession } from '#/state/session';
import { FeedSourceCard } from '#/view/com/feeds/FeedSourceCard';
import { Post } from '#/view/com/post/Post';
import { formatCount } from '#/view/com/util/numeric/format';
import { TimeElapsed } from '#/view/com/util/TimeElapsed';
import * as Toast from '#/view/com/util/Toast';
import { PreviewableUserAvatar, UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, platform, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { BellRinging_Filled_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon, ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon, } from '#/components/icons/Chevron';
import { Contacts_Filled_Corner2_Rounded as ContactsIconFilled } from '#/components/icons/Contacts';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled } from '#/components/icons/Heart2';
import { PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { StarterPack } from '#/components/icons/StarterPack';
import { VerifiedCheck } from '#/components/icons/VerifiedCheck';
import { InlineLinkText, Link } from '#/components/Link';
import * as MediaPreview from '#/components/MediaPreview';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Notification as StarterPackCard } from '#/components/StarterPack/StarterPackCard';
import { SubtleHover } from '#/components/SubtleHover';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
import { VerificationCheck } from '#/components/verification/VerificationCheck';
import * as bsky from '#/types/bsky';
var MAX_AUTHORS = 5;
var EXPANDED_AUTHOR_EL_HEIGHT = 35;
var NotificationFeedItem = function (_a) {
    var _b;
    var item = _a.item, moderationOpts = _a.moderationOpts, highlightUnread = _a.highlightUnread, hideTopBorder = _a.hideTopBorder;
    var queryClient = useQueryClient();
    var pal = usePalette('default');
    var t = useTheme();
    var _c = useLingui(), _ = _c._, i18n = _c.i18n;
    var _d = useState(false), isAuthorsExpanded = _d[0], setAuthorsExpanded = _d[1];
    var itemHref = useMemo(function () {
        var _a;
        switch (item.type) {
            case 'post-like':
            case 'repost':
            case 'like-via-repost':
            case 'repost-via-repost': {
                if (item.subjectUri) {
                    var urip = new AtUri(item.subjectUri);
                    return "/profile/".concat(urip.host, "/post/").concat(urip.rkey);
                }
                break;
            }
            case 'follow':
            case 'contact-match':
            case 'verified':
            case 'unverified': {
                return makeProfileLink(item.notification.author);
            }
            case 'reply':
            case 'mention':
            case 'quote': {
                var uripReply = new AtUri(item.notification.uri);
                return "/profile/".concat(uripReply.host, "/post/").concat(uripReply.rkey);
            }
            case 'feedgen-like':
            case 'starterpack-joined': {
                if (item.subjectUri) {
                    var urip = new AtUri(item.subjectUri);
                    return "/profile/".concat(urip.host, "/feed/").concat(urip.rkey);
                }
                break;
            }
            case 'subscribed-post': {
                var posts = [];
                for (var _i = 0, _b = __spreadArray([item.notification], ((_a = item.additional) !== null && _a !== void 0 ? _a : []), true); _i < _b.length; _i++) {
                    var post = _b[_i];
                    posts.push(post.uri);
                }
                return "/notifications/activity?posts=".concat(encodeURIComponent(posts.slice(0, 25).join(',')));
            }
        }
        return '';
    }, [item]);
    var onToggleAuthorsExpanded = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setAuthorsExpanded(function (currentlyExpanded) { return !currentlyExpanded; });
    };
    var onBeforePress = useCallback(function () {
        unstableCacheProfileView(queryClient, item.notification.author);
    }, [queryClient, item.notification.author]);
    var authors = useMemo(function () {
        var _a;
        return __spreadArray([
            {
                profile: item.notification.author,
                href: makeProfileLink(item.notification.author),
                moderation: moderateProfile(item.notification.author, moderationOpts),
            }
        ], (((_a = item.additional) === null || _a === void 0 ? void 0 : _a.map(function (_a) {
            var author = _a.author;
            return ({
                profile: author,
                href: makeProfileLink(author),
                moderation: moderateProfile(author, moderationOpts),
            });
        })) || []), true).filter(function (author, index, arr) {
            return arr.findIndex(function (au) { return au.profile.did === author.profile.did; }) === index;
        });
    }, [item, moderationOpts]);
    var niceTimestamp = niceDate(i18n, item.notification.indexedAt);
    var firstAuthor = authors[0];
    var firstAuthorVerification = useSimpleVerificationState({
        profile: firstAuthor.profile,
    });
    var firstAuthorName = sanitizeDisplayName(firstAuthor.profile.displayName || firstAuthor.profile.handle);
    // Calculate if this is a follow-back notification
    var isFollowBack = useMemo(function () {
        var _a;
        if (item.type !== 'follow')
            return false;
        if (((_a = item.notification.author.viewer) === null || _a === void 0 ? void 0 : _a.following) &&
            bsky.dangerousIsType(item.notification.record, AppBskyGraphFollow.isRecord)) {
            var followingTimestamp = void 0;
            try {
                var rkey = new AtUri(item.notification.author.viewer.following).rkey;
                followingTimestamp = TID.fromStr(rkey).timestamp();
            }
            catch (e) {
                return false;
            }
            if (followingTimestamp) {
                var followedTimestamp = new Date(item.notification.record.createdAt).getTime() * 1000;
                return followedTimestamp > followingTimestamp;
            }
        }
        return false;
    }, [item]);
    if (item.subjectUri && !item.subject && item.type !== 'feedgen-like') {
        // don't render anything if the target post was deleted or unfindable
        return _jsx(View, {});
    }
    if (item.type === 'reply' ||
        item.type === 'mention' ||
        item.type === 'quote') {
        if (!item.subject) {
            return null;
        }
        var isHighlighted = highlightUnread && !item.notification.isRead;
        return (_jsx(View, { testID: "feedItem-by-".concat(item.notification.author.handle), children: _jsx(Post, { post: item.subject, style: isHighlighted && {
                    backgroundColor: pal.colors.unreadNotifBg,
                    borderColor: pal.colors.unreadNotifBorder,
                }, hideTopBorder: hideTopBorder }) }));
    }
    var firstAuthorLink = (_jsx(ProfileHoverCard, { did: firstAuthor.profile.did, inline: true, children: _jsxs(InlineLinkText, { style: [t.atoms.text, a.font_semi_bold, a.text_md, a.leading_tight], to: firstAuthor.href, disableMismatchWarning: true, emoji: true, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Go to ", "'s profile"], ["Go to ", "'s profile"])), firstAuthorName)), children: [forceLTR(firstAuthorName), firstAuthorVerification.showBadge && (_jsx(View, { style: [
                        a.relative,
                        {
                            paddingTop: platform({ android: 2 }),
                            marginBottom: platform({ ios: -7 }),
                            top: platform({ web: 1 }),
                            paddingLeft: 3,
                            paddingRight: 2,
                        },
                    ], children: _jsx(VerificationCheck, { width: 14, verifier: firstAuthorVerification.role === 'verifier' }) }))] }, firstAuthor.href) }));
    var additionalAuthorsCount = authors.length - 1;
    var hasMultipleAuthors = additionalAuthorsCount > 0;
    var formattedAuthorsCount = hasMultipleAuthors
        ? formatCount(i18n, additionalAuthorsCount)
        : '';
    var a11yLabel = '';
    var notificationContent;
    var icon = (_jsx(HeartIconFilled, { size: "xl", style: [
            s.likeColor,
            // {position: 'relative', top: -4}
        ] }));
    if (item.type === 'post-like') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " and ", " liked your post"], ["", " and ", " liked your post"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", " liked your post"], ["", " liked your post"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "liked your post"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " liked your post"] }));
    }
    else if (item.type === 'repost') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["", " and ", " reposted your post"], ["", " and ", " reposted your post"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", " reposted your post"], ["", " reposted your post"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "reposted your post"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " reposted your post"] }));
        icon = _jsx(RepostIcon, { size: "xl", style: { color: t.palette.positive_500 } });
    }
    else if (item.type === 'follow') {
        if (isFollowBack && !hasMultipleAuthors) {
            /*
             * Follow-backs are ungrouped, grouped follow-backs not supported atm,
             * see `src/state/queries/notifications/util.ts`
             */
            a11yLabel = _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["", " followed you back"], ["", " followed you back"])), firstAuthorName));
            notificationContent = _jsxs(Trans, { children: [firstAuthorLink, " followed you back"] });
        }
        else {
            a11yLabel = hasMultipleAuthors
                ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", " and ", " followed you"], ["", " and ", " followed you"])), firstAuthorName, plural(additionalAuthorsCount, {
                    one: "".concat(formattedAuthorsCount, " other"),
                    other: "".concat(formattedAuthorsCount, " others"),
                })))
                : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["", " followed you"], ["", " followed you"])), firstAuthorName));
            notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "followed you"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " followed you"] }));
        }
        icon = _jsx(PersonPlusIcon, { size: "xl", style: { color: t.palette.primary_500 } });
    }
    else if (item.type === 'contact-match') {
        a11yLabel = _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Your contact ", " is on Bluesky"], ["Your contact ", " is on Bluesky"])), firstAuthorName));
        notificationContent = (_jsxs(Trans, { children: ["Your contact ", firstAuthorLink, " is on Bluesky"] }));
        icon = (_jsx(ContactsIconFilled, { size: "xl", style: { color: t.palette.primary_500 } }));
    }
    else if (item.type === 'feedgen-like') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", " and ", " liked your custom feed"], ["", " and ", " liked your custom feed"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["", " liked your custom feed"], ["", " liked your custom feed"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "liked your custom feed"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " liked your custom feed"] }));
    }
    else if (item.type === 'starterpack-joined') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", " and ", " signed up with your starter pack"], ["", " and ", " signed up with your starter pack"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["", " signed up with your starter pack"], ["", " signed up with your starter pack"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "signed up with your starter pack"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " signed up with your starter pack"] }));
        icon = (_jsx(View, { style: { height: 30, width: 30 }, children: _jsx(StarterPack, { width: 30, gradient: "sky" }) }));
    }
    else if (item.type === 'verified') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", " and ", " verified you"], ["", " and ", " verified you"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["", " verified you"], ["", " verified you"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "verified you"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " verified you"] }));
        icon = _jsx(VerifiedCheck, { size: "xl" });
    }
    else if (item.type === 'unverified') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["", " and ", " removed their verifications from your account"], ["", " and ", " removed their verifications from your account"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["", " removed their verification from your account"], ["", " removed their verification from your account"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "removed their verifications from your account"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " removed their verification from your account"] }));
        icon = _jsx(VerifiedCheck, { size: "xl", fill: t.palette.contrast_500 });
    }
    else if (item.type === 'like-via-repost') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["", " and ", " liked your repost"], ["", " and ", " liked your repost"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["", " liked your repost"], ["", " liked your repost"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "liked your repost"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " liked your repost"] }));
    }
    else if (item.type === 'repost-via-repost') {
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["", " and ", " reposted your repost"], ["", " and ", " reposted your repost"])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["", " reposted your repost"], ["", " reposted your repost"])), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: [firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' ', "reposted your repost"] })) : (_jsxs(Trans, { children: [firstAuthorLink, " reposted your repost"] }));
        icon = _jsx(RepostIcon, { size: "xl", style: { color: t.palette.positive_500 } });
    }
    else if (item.type === 'subscribed-post') {
        var postsCount = 1 + (((_b = item.additional) === null || _b === void 0 ? void 0 : _b.length) || 0);
        a11yLabel = hasMultipleAuthors
            ? _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["New posts from ", " and ", ""], ["New posts from ", " and ", ""])), firstAuthorName, plural(additionalAuthorsCount, {
                one: "".concat(formattedAuthorsCount, " other"),
                other: "".concat(formattedAuthorsCount, " others"),
            })))
            : _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["New ", " from ", ""], ["New ", " from ", ""])), plural(postsCount, {
                one: 'post',
                other: 'posts',
            }), firstAuthorName));
        notificationContent = hasMultipleAuthors ? (_jsxs(Trans, { children: ["New posts from ", firstAuthorLink, " and", ' ', _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: _jsx(Plural, { value: additionalAuthorsCount, one: "".concat(formattedAuthorsCount, " other"), other: "".concat(formattedAuthorsCount, " others") }) }), ' '] })) : (_jsxs(Trans, { children: ["New ", _jsx(Plural, { value: postsCount, one: "post", other: "posts" }), " from", ' ', firstAuthorLink] }));
        icon = _jsx(BellRingingIcon, { size: "xl", style: { color: t.palette.primary_500 } });
    }
    else {
        return null;
    }
    a11yLabel += " \u00B7 ".concat(niceTimestamp);
    return (_jsx(Link, { label: a11yLabel, testID: "feedItem-by-".concat(item.notification.author.handle), style: [
            a.flex_row,
            a.align_start,
            { padding: 10 },
            a.pr_lg,
            t.atoms.border_contrast_low,
            item.notification.isRead
                ? undefined
                : {
                    backgroundColor: pal.colors.unreadNotifBg,
                    borderColor: pal.colors.unreadNotifBorder,
                },
            !hideTopBorder && a.border_t,
            a.overflow_hidden,
        ], to: itemHref, accessible: !isAuthorsExpanded, accessibilityActions: hasMultipleAuthors
            ? [
                {
                    name: 'toggleAuthorsExpanded',
                    label: isAuthorsExpanded
                        ? _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Collapse list of users"], ["Collapse list of users"]))))
                        : _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Expand list of users"], ["Expand list of users"])))),
                },
            ]
            : [
                {
                    name: 'viewProfile',
                    label: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["View ", "'s profile"], ["View ", "'s profile"])), authors[0].profile.displayName || authors[0].profile.handle)),
                },
            ], onAccessibilityAction: function (e) {
            if (e.nativeEvent.actionName === 'activate') {
                onBeforePress();
            }
            if (e.nativeEvent.actionName === 'toggleAuthorsExpanded') {
                onToggleAuthorsExpanded();
            }
        }, children: function (_a) {
            var _b;
            var hovered = _a.hovered;
            return (_jsxs(_Fragment, { children: [_jsx(SubtleHover, { hover: hovered }), _jsx(View, { style: [styles.layoutIcon, a.pr_sm], children: icon }), _jsxs(View, { style: [a.flex_1], children: [_jsxs(ExpandListPressable, { hasMultipleAuthors: hasMultipleAuthors, onToggleAuthorsExpanded: onToggleAuthorsExpanded, children: [_jsx(CondensedAuthorsList, { visible: !isAuthorsExpanded, authors: authors, onToggleAuthorsExpanded: onToggleAuthorsExpanded, showDmButton: item.type === 'starterpack-joined' }), _jsx(ExpandedAuthorsList, { visible: isAuthorsExpanded, authors: authors }), _jsxs(Text, { style: [
                                            a.flex_row,
                                            a.flex_wrap,
                                            { paddingTop: 6 },
                                            a.self_start,
                                            a.text_md,
                                            a.leading_snug,
                                        ], accessibilityHint: "", accessibilityLabel: a11yLabel, children: [notificationContent, _jsx(TimeElapsed, { timestamp: item.notification.indexedAt, children: function (_a) {
                                                    var timeElapsed = _a.timeElapsed;
                                                    return (_jsxs(_Fragment, { children: [_jsxs(Text, { style: [a.text_md, t.atoms.text_contrast_medium], children: [' ', "\u00B7", ' '] }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_medium], title: niceTimestamp, children: timeElapsed })] }));
                                                } })] })] }), (item.type === 'follow' && !hasMultipleAuthors && !isFollowBack) ||
                                (item.type === 'contact-match' &&
                                    !((_b = item.notification.author.viewer) === null || _b === void 0 ? void 0 : _b.following)) ? (_jsx(FollowBackButton, { profile: item.notification.author })) : null, item.type === 'post-like' ||
                                item.type === 'repost' ||
                                item.type === 'like-via-repost' ||
                                item.type === 'repost-via-repost' ||
                                item.type === 'subscribed-post' ? (_jsx(View, { style: [a.pt_2xs], children: _jsx(AdditionalPostText, { post: item.subject }) })) : null, item.type === 'feedgen-like' && item.subjectUri ? (_jsx(FeedSourceCard, { feedUri: item.subjectUri, link: false, style: [
                                    t.atoms.bg,
                                    t.atoms.border_contrast_low,
                                    a.border,
                                    a.p_md,
                                    styles.feedcard,
                                ], showLikes: true })) : null, item.type === 'starterpack-joined' ? (_jsx(View, { children: _jsx(View, { style: [
                                        a.border,
                                        a.p_sm,
                                        a.rounded_sm,
                                        a.mt_sm,
                                        t.atoms.border_contrast_low,
                                    ], children: _jsx(StarterPackCard, { starterPack: item.subject }) }) })) : null] })] }));
        } }));
};
NotificationFeedItem = memo(NotificationFeedItem);
export { NotificationFeedItem };
function ExpandListPressable(_a) {
    var hasMultipleAuthors = _a.hasMultipleAuthors, children = _a.children, onToggleAuthorsExpanded = _a.onToggleAuthorsExpanded;
    if (hasMultipleAuthors) {
        return (_jsx(Pressable, { onPress: onToggleAuthorsExpanded, style: [styles.expandedAuthorsTrigger], accessible: false, children: children }));
    }
    else {
        return _jsx(_Fragment, { children: children });
    }
}
function FollowBackButton(_a) {
    var _this = this;
    var profile = _a.profile;
    var _ = useLingui()._;
    var _b = useSession(), currentAccount = _b.currentAccount, hasSession = _b.hasSession;
    var profileShadow = useProfileShadow(profile);
    var _c = useProfileFollowMutationQueue(profileShadow, 'ProfileCard'), queueFollow = _c[0], queueUnfollow = _c[1];
    // Don't show button if not logged in or for own profile
    if (!hasSession || profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
        return null;
    }
    var onPressFollow = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueFollow()];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Following ", ""], ["Following ", ""])), sanitizeDisplayName(profile.displayName || profile.handle))));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    if ((err_1 === null || err_1 === void 0 ? void 0 : err_1.name) !== 'AbortError') {
                        Toast.show(_(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["An issue occurred, please try again."], ["An issue occurred, please try again."])))), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var onPressUnfollow = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    e.stopPropagation();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, queueUnfollow()];
                case 2:
                    _a.sent();
                    Toast.show(_(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["No longer following ", ""], ["No longer following ", ""])), sanitizeDisplayName(profile.displayName || profile.handle))));
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    if ((err_2 === null || err_2 === void 0 ? void 0 : err_2.name) !== 'AbortError') {
                        Toast.show(_(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["An issue occurred, please try again."], ["An issue occurred, please try again."])))), 'xmark');
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Don't show button if viewer data is missing or user is blocked
    if (!profileShadow.viewer) {
        return null;
    }
    if (profileShadow.viewer.blockedBy ||
        profileShadow.viewer.blocking ||
        profileShadow.viewer.blockingByList) {
        return null;
    }
    var isFollowing = profileShadow.viewer.following;
    var isFollowedBy = profileShadow.viewer.followedBy;
    var followingLabel = _(msg({
        message: 'Following',
        comment: 'User is following this account, click to unfollow',
    }));
    return (_jsx(View, { style: [a.pt_sm], children: isFollowing ? (_jsxs(Button, { label: followingLabel, color: "secondary", size: "small", style: [a.self_start], onPress: onPressUnfollow, children: [_jsx(ButtonIcon, { icon: CheckIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Following" }) })] })) : (_jsxs(Button, { label: isFollowedBy ? _(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Follow back"], ["Follow back"])))) : _(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Follow"], ["Follow"])))), color: "primary", size: "small", style: [a.self_start], onPress: onPressFollow, children: [_jsx(ButtonIcon, { icon: PlusIcon }), _jsx(ButtonText, { children: isFollowedBy ? _jsx(Trans, { children: "Follow back" }) : _jsx(Trans, { children: "Follow" }) })] })) }));
}
function SayHelloBtn(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f;
    var profile = _a.profile;
    var _ = useLingui()._;
    var agent = useAgent();
    var navigation = useNavigation();
    var _g = useState(false), isLoading = _g[0], setIsLoading = _g[1];
    if (((_c = (_b = profile.associated) === null || _b === void 0 ? void 0 : _b.chat) === null || _c === void 0 ? void 0 : _c.allowIncoming) === 'none' ||
        (((_e = (_d = profile.associated) === null || _d === void 0 ? void 0 : _d.chat) === null || _e === void 0 ? void 0 : _e.allowIncoming) === 'following' &&
            !((_f = profile.viewer) === null || _f === void 0 ? void 0 : _f.followedBy))) {
        return null;
    }
    return (_jsx(Button, { label: _(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Say hello!"], ["Say hello!"])))), variant: "ghost", color: "primary", size: "small", style: [a.self_center, { marginLeft: 'auto' }], disabled: isLoading, onPress: function () { return __awaiter(_this, void 0, void 0, function () {
            var res, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setIsLoading(true);
                        return [4 /*yield*/, agent.api.chat.bsky.convo.getConvoForMembers({
                                members: [profile.did, agent.session.did],
                            }, { headers: DM_SERVICE_HEADERS })];
                    case 1:
                        res = _a.sent();
                        navigation.navigate('MessagesConversation', {
                            conversation: res.data.convo.id,
                        });
                        return [3 /*break*/, 4];
                    case 2:
                        e_1 = _a.sent();
                        logger.error('Failed to get conversation', { safeMessage: e_1 });
                        return [3 /*break*/, 4];
                    case 3:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Say hello!" }) }) }));
}
function CondensedAuthorsList(_a) {
    var _b;
    var visible = _a.visible, authors = _a.authors, onToggleAuthorsExpanded = _a.onToggleAuthorsExpanded, _c = _a.showDmButton, showDmButton = _c === void 0 ? true : _c;
    var t = useTheme();
    var _ = useLingui()._;
    if (!visible) {
        return (_jsx(View, { style: [a.flex_row, a.align_center], children: _jsxs(TouchableOpacity, { style: styles.expandedAuthorsCloseBtn, onPress: onToggleAuthorsExpanded, accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_34 || (templateObject_34 = __makeTemplateObject(["Hide user list"], ["Hide user list"])))), accessibilityHint: _(msg(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Collapses list of users for a given notification"], ["Collapses list of users for a given notification"])))), children: [_jsx(ChevronUpIcon, { size: "md", style: [a.ml_xs, a.mr_md, t.atoms.text_contrast_high] }), _jsx(Text, { style: [a.text_md, t.atoms.text_contrast_high], children: _jsx(Trans, { context: "action", children: "Hide" }) })] }) }));
    }
    if (authors.length === 1) {
        return (_jsxs(View, { style: [a.flex_row, a.align_center], children: [_jsx(PreviewableUserAvatar, { size: 35, profile: authors[0].profile, moderation: authors[0].moderation.ui('avatar'), type: ((_b = authors[0].profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user' }), showDmButton ? _jsx(SayHelloBtn, { profile: authors[0].profile }) : null] }));
    }
    return (_jsx(TouchableOpacity, { accessibilityRole: "none", onPress: onToggleAuthorsExpanded, children: _jsxs(View, { style: [a.flex_row, a.align_center], children: [authors.slice(0, MAX_AUTHORS).map(function (author) {
                    var _a;
                    return (_jsx(View, { style: s.mr5, children: _jsx(PreviewableUserAvatar, { size: 35, profile: author.profile, moderation: author.moderation.ui('avatar'), type: ((_a = author.profile.associated) === null || _a === void 0 ? void 0 : _a.labeler) ? 'labeler' : 'user' }) }, author.href));
                }), authors.length > MAX_AUTHORS ? (_jsxs(Text, { style: [
                        a.font_semi_bold,
                        { paddingLeft: 6 },
                        t.atoms.text_contrast_medium,
                    ], children: ["+", authors.length - MAX_AUTHORS] })) : undefined, _jsx(ChevronDownIcon, { size: "md", style: [a.mx_xs, t.atoms.text_contrast_medium] })] }) }));
}
function ExpandedAuthorsList(_a) {
    var visible = _a.visible, authors = _a.authors;
    var heightInterp = useAnimatedValue(visible ? 1 : 0);
    var targetHeight = authors.length * (EXPANDED_AUTHOR_EL_HEIGHT + 10); /*10=margin*/
    var heightStyle = {
        height: Animated.multiply(heightInterp, targetHeight),
    };
    useEffect(function () {
        Animated.timing(heightInterp, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [heightInterp, visible]);
    return (_jsx(Animated.View, { style: [a.overflow_hidden, heightStyle], children: visible &&
            authors.map(function (author) { return (_jsx(ExpandedAuthorCard, { author: author }, author.profile.did)); }) }));
}
function ExpandedAuthorCard(_a) {
    var _b;
    var author = _a.author;
    var t = useTheme();
    var _ = useLingui()._;
    var verification = useSimpleVerificationState({
        profile: author.profile,
    });
    return (_jsxs(Link, { label: author.profile.displayName || author.profile.handle, accessibilityHint: _(msg(templateObject_36 || (templateObject_36 = __makeTemplateObject(["Opens this profile"], ["Opens this profile"])))), to: makeProfileLink({
            did: author.profile.did,
            handle: author.profile.handle,
        }), style: styles.expandedAuthor, children: [_jsx(View, { style: [a.mr_sm], children: _jsx(ProfileHoverCard, { did: author.profile.did, children: _jsx(UserAvatar, { size: 35, avatar: author.profile.avatar, moderation: author.moderation.ui('avatar'), type: ((_b = author.profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'user' }) }) }), _jsx(View, { style: [a.flex_1], children: _jsxs(View, { style: [a.flex_row, a.align_end], children: [_jsx(Text, { numberOfLines: 1, emoji: true, style: [
                                a.text_md,
                                a.font_semi_bold,
                                a.leading_tight,
                                { maxWidth: '70%' },
                            ], children: sanitizeDisplayName(author.profile.displayName || author.profile.handle) }), verification.showBadge && (_jsx(View, { style: [a.pl_xs, a.self_center], children: _jsx(VerificationCheck, { width: 14, verifier: verification.role === 'verifier' }) })), _jsx(Text, { numberOfLines: 1, style: [
                                a.pl_xs,
                                a.text_md,
                                a.leading_tight,
                                a.flex_shrink,
                                t.atoms.text_contrast_medium,
                            ], children: sanitizeHandle(author.profile.handle, '@') })] }) })] }, author.profile.did));
}
function AdditionalPostText(_a) {
    var post = _a.post;
    var t = useTheme();
    if (post &&
        bsky.dangerousIsType(post === null || post === void 0 ? void 0 : post.record, AppBskyFeedPost.isRecord)) {
        var text = post.record.text;
        return (_jsxs(_Fragment, { children: [(text === null || text === void 0 ? void 0 : text.length) > 0 && (_jsx(Text, { emoji: true, style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], numberOfLines: MAX_POST_LINES, children: text })), _jsx(MediaPreview.Embed, { embed: post.embed, style: styles.additionalPostImages })] }));
    }
}
var styles = StyleSheet.create({
    layoutIcon: {
        width: 60,
        alignItems: 'flex-end',
        paddingTop: 2,
    },
    icon: {
        marginRight: 10,
        marginTop: 4,
    },
    additionalPostImages: {
        marginTop: 5,
        marginLeft: 2,
        opacity: 0.8,
    },
    feedcard: {
        borderRadius: 8,
        marginTop: 6,
    },
    addedContainer: {
        paddingTop: 4,
        paddingLeft: 36,
    },
    expandedAuthorsTrigger: {
        zIndex: 1,
    },
    expandedAuthorsCloseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 6,
    },
    expandedAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        height: EXPANDED_AUTHOR_EL_HEIGHT,
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36;
