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
import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateProfile, RichText as RichTextAPI, } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import { ComposeIcon2 } from '#/lib/icons';
import { combinedDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { isInvalidHandle } from '#/lib/strings/handles';
import { colors, s } from '#/lib/styles';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { listenSoftReset } from '#/state/events';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useLabelerInfoQuery } from '#/state/queries/labeler';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useAgent, useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import { ProfileFeedgens } from '#/view/com/feeds/ProfileFeedgens';
import { ProfileLists } from '#/view/com/lists/ProfileLists';
import { PagerWithHeader } from '#/view/com/pager/PagerWithHeader';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { FAB } from '#/view/com/util/fab/FAB';
import { ProfileHeader, ProfileHeaderLoading } from '#/screens/Profile/Header';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';
import { ProfileLabelsSection } from '#/screens/Profile/Sections/Labels';
import { atoms as a } from '#/alf';
import { Circle_And_Square_Stroke1_Corner0_Rounded_Filled as CircleAndSquareIcon } from '#/components/icons/CircleAndSquare';
import { Heart2_Stroke1_Corner0_Rounded as HeartIcon } from '#/components/icons/Heart2';
import { Image_Stroke1_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Message_Stroke1_Corner0_Rounded_Filled as MessageIcon } from '#/components/icons/Message';
import { VideoClip_Stroke1_Corner0_Rounded as VideoIcon } from '#/components/icons/VideoClip';
import * as Layout from '#/components/Layout';
import { ScreenHider } from '#/components/moderation/ScreenHider';
import { ProfileStarterPacks } from '#/components/StarterPack/ProfileStarterPacks';
import { navigate } from '#/Navigation';
import { ExpoScrollForwarderView } from '../../../modules/expo-scroll-forwarder';
export function ProfileScreen(props) {
    return (_jsx(Layout.Screen, { testID: "profileScreen", style: [a.pt_0], children: _jsx(ProfileScreenInner, __assign({}, props)) }));
}
function ProfileScreenInner(_a) {
    var _b;
    var route = _a.route;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var queryClient = useQueryClient();
    var name = route.params.name === 'me' ? currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did : route.params.name;
    var moderationOpts = useModerationOpts();
    var _c = useResolveDidQuery(name), resolvedDid = _c.data, resolveError = _c.error, refetchDid = _c.refetch, isLoadingDid = _c.isLoading;
    var _d = useProfileQuery({
        did: resolvedDid,
    }), profile = _d.data, profileError = _d.error, refetchProfile = _d.refetch, isLoadingProfile = _d.isLoading, isPlaceholderProfile = _d.isPlaceholderData;
    var onPressTryAgain = React.useCallback(function () {
        if (resolveError) {
            refetchDid();
        }
        else {
            refetchProfile();
        }
    }, [resolveError, refetchDid, refetchProfile]);
    // Apply hard-coded redirects as need
    React.useEffect(function () {
        if (resolveError) {
            if (name === 'lulaoficial.bsky.social') {
                console.log('Applying redirect to lula.com.br');
                navigate('Profile', { name: 'lula.com.br' });
            }
        }
    }, [name, resolveError]);
    // When we open the profile, we want to reset the posts query if we are blocked.
    React.useEffect(function () {
        var _a;
        if (resolvedDid && ((_a = profile === null || profile === void 0 ? void 0 : profile.viewer) === null || _a === void 0 ? void 0 : _a.blockedBy)) {
            resetProfilePostsQueries(queryClient, resolvedDid);
        }
    }, [queryClient, (_b = profile === null || profile === void 0 ? void 0 : profile.viewer) === null || _b === void 0 ? void 0 : _b.blockedBy, resolvedDid]);
    // Most pushes will happen here, since we will have only placeholder data
    if (isLoadingDid || isLoadingProfile) {
        return (_jsx(Layout.Content, { children: _jsx(ProfileHeaderLoading, {}) }));
    }
    if (resolveError || profileError) {
        return (_jsx(SafeAreaView, { style: [a.flex_1], children: _jsx(ErrorScreen, { testID: "profileErrorScreen", title: profileError ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Not Found"], ["Not Found"])))) : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Oops!"], ["Oops!"])))), message: cleanError(resolveError || profileError), onPressTryAgain: onPressTryAgain, showHeader: true }) }));
    }
    if (profile && moderationOpts) {
        return (_jsx(ProfileScreenLoaded, { profile: profile, moderationOpts: moderationOpts, isPlaceholderProfile: isPlaceholderProfile, hideBackButton: !!route.params.hideBackButton }));
    }
    // should never happen
    return (_jsx(SafeAreaView, { style: [a.flex_1], children: _jsx(ErrorScreen, { testID: "profileErrorScreen", title: "Oops!", message: "Something went wrong and we're not sure what.", onPressTryAgain: onPressTryAgain, showHeader: true }) }));
}
function ProfileScreenLoaded(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var profileUnshadowed = _a.profile, isPlaceholderProfile = _a.isPlaceholderProfile, moderationOpts = _a.moderationOpts, hideBackButton = _a.hideBackButton;
    var profile = useProfileShadow(profileUnshadowed);
    var _k = useSession(), hasSession = _k.hasSession, currentAccount = _k.currentAccount;
    var setMinimalShellMode = useSetMinimalShellMode();
    var openComposer = useOpenComposer().openComposer;
    var navigation = useNavigation();
    var requireEmailVerification = useRequireEmailVerification();
    var _l = useLabelerInfoQuery({
        did: profile.did,
        enabled: !!((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler),
    }), labelerInfo = _l.data, labelerError = _l.error, isLabelerLoading = _l.isLoading;
    var _m = React.useState(0), currentPage = _m[0], setCurrentPage = _m[1];
    var _ = useLingui()._;
    var _o = React.useState(null), scrollViewTag = _o[0], setScrollViewTag = _o[1];
    var postsSectionRef = React.useRef(null);
    var repliesSectionRef = React.useRef(null);
    var mediaSectionRef = React.useRef(null);
    var videosSectionRef = React.useRef(null);
    var likesSectionRef = React.useRef(null);
    var feedsSectionRef = React.useRef(null);
    var listsSectionRef = React.useRef(null);
    var starterPacksSectionRef = React.useRef(null);
    var labelsSectionRef = React.useRef(null);
    useSetTitle(combinedDisplayName(profile));
    var description = (_c = profile.description) !== null && _c !== void 0 ? _c : '';
    var hasDescription = description !== '';
    var _p = useRichText(description), descriptionRT = _p[0], isResolvingDescriptionRT = _p[1];
    var showPlaceholder = isPlaceholderProfile || isResolvingDescriptionRT;
    var moderation = useMemo(function () { return moderateProfile(profile, moderationOpts); }, [profile, moderationOpts]);
    var isMe = profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var hasLabeler = !!((_d = profile.associated) === null || _d === void 0 ? void 0 : _d.labeler);
    var showFiltersTab = hasLabeler;
    var showPostsTab = true;
    var showRepliesTab = hasSession;
    var showMediaTab = !hasLabeler;
    var showVideosTab = !hasLabeler;
    var showLikesTab = isMe;
    var feedGenCount = ((_e = profile.associated) === null || _e === void 0 ? void 0 : _e.feedgens) || 0;
    var showFeedsTab = isMe || feedGenCount > 0;
    var starterPackCount = ((_f = profile.associated) === null || _f === void 0 ? void 0 : _f.starterPacks) || 0;
    var showStarterPacksTab = isMe || starterPackCount > 0;
    // subtract starterpack count from list count, since starterpacks are a type of list
    var listCount = (((_g = profile.associated) === null || _g === void 0 ? void 0 : _g.lists) || 0) - starterPackCount;
    var showListsTab = hasSession && (isMe || listCount > 0);
    var sectionTitles = [
        showFiltersTab ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Labels"], ["Labels"])))) : undefined,
        showListsTab && hasLabeler ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Lists"], ["Lists"])))) : undefined,
        showPostsTab ? _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Posts"], ["Posts"])))) : undefined,
        showRepliesTab ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Replies"], ["Replies"])))) : undefined,
        showMediaTab ? _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Media"], ["Media"])))) : undefined,
        showVideosTab ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Videos"], ["Videos"])))) : undefined,
        showLikesTab ? _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Likes"], ["Likes"])))) : undefined,
        showFeedsTab ? _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Feeds"], ["Feeds"])))) : undefined,
        showStarterPacksTab ? _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Starter Packs"], ["Starter Packs"])))) : undefined,
        showListsTab && !hasLabeler ? _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Lists"], ["Lists"])))) : undefined,
    ].filter(Boolean);
    var nextIndex = 0;
    var filtersIndex = null;
    var postsIndex = null;
    var repliesIndex = null;
    var mediaIndex = null;
    var videosIndex = null;
    var likesIndex = null;
    var feedsIndex = null;
    var starterPacksIndex = null;
    var listsIndex = null;
    if (showFiltersTab) {
        filtersIndex = nextIndex++;
    }
    if (showPostsTab) {
        postsIndex = nextIndex++;
    }
    if (showRepliesTab) {
        repliesIndex = nextIndex++;
    }
    if (showMediaTab) {
        mediaIndex = nextIndex++;
    }
    if (showVideosTab) {
        videosIndex = nextIndex++;
    }
    if (showLikesTab) {
        likesIndex = nextIndex++;
    }
    if (showFeedsTab) {
        feedsIndex = nextIndex++;
    }
    if (showStarterPacksTab) {
        starterPacksIndex = nextIndex++;
    }
    if (showListsTab) {
        listsIndex = nextIndex++;
    }
    var scrollSectionToTop = useCallback(function (index) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (index === filtersIndex) {
            (_a = labelsSectionRef.current) === null || _a === void 0 ? void 0 : _a.scrollToTop();
        }
        else if (index === postsIndex) {
            (_b = postsSectionRef.current) === null || _b === void 0 ? void 0 : _b.scrollToTop();
        }
        else if (index === repliesIndex) {
            (_c = repliesSectionRef.current) === null || _c === void 0 ? void 0 : _c.scrollToTop();
        }
        else if (index === mediaIndex) {
            (_d = mediaSectionRef.current) === null || _d === void 0 ? void 0 : _d.scrollToTop();
        }
        else if (index === videosIndex) {
            (_e = videosSectionRef.current) === null || _e === void 0 ? void 0 : _e.scrollToTop();
        }
        else if (index === likesIndex) {
            (_f = likesSectionRef.current) === null || _f === void 0 ? void 0 : _f.scrollToTop();
        }
        else if (index === feedsIndex) {
            (_g = feedsSectionRef.current) === null || _g === void 0 ? void 0 : _g.scrollToTop();
        }
        else if (index === starterPacksIndex) {
            (_h = starterPacksSectionRef.current) === null || _h === void 0 ? void 0 : _h.scrollToTop();
        }
        else if (index === listsIndex) {
            (_j = listsSectionRef.current) === null || _j === void 0 ? void 0 : _j.scrollToTop();
        }
    }, [
        filtersIndex,
        postsIndex,
        repliesIndex,
        mediaIndex,
        videosIndex,
        likesIndex,
        feedsIndex,
        listsIndex,
        starterPacksIndex,
    ]);
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(false);
        return listenSoftReset(function () {
            scrollSectionToTop(currentPage);
        });
    }, [setMinimalShellMode, currentPage, scrollSectionToTop]));
    // events
    // =
    var onPressCompose = function () {
        var mention = profile.handle === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.handle) ||
            isInvalidHandle(profile.handle)
            ? undefined
            : profile.handle;
        openComposer({ mention: mention });
    };
    var onPageSelected = function (i) {
        setCurrentPage(i);
    };
    var onCurrentPageSelected = function (index) {
        scrollSectionToTop(index);
    };
    var navToWizard = useCallback(function () {
        navigation.navigate('StarterPackWizard', {});
    }, [navigation]);
    var wrappedNavToWizard = requireEmailVerification(navToWizard, {
        instructions: [
            _jsx(Trans, { children: "Before creating a starter pack, you must first verify your email." }, "nav"),
        ],
    });
    // rendering
    // =
    var renderHeader = function (_a) {
        var setMinimumHeight = _a.setMinimumHeight;
        return (_jsx(ExpoScrollForwarderView, { scrollViewTag: scrollViewTag, children: _jsx(ProfileHeader, { profile: profile, labeler: labelerInfo, descriptionRT: hasDescription ? descriptionRT : null, moderationOpts: moderationOpts, hideBackButton: hideBackButton, isPlaceholderProfile: showPlaceholder, setMinimumHeight: setMinimumHeight }) }));
    };
    return (_jsxs(ScreenHider, { testID: "profileView", style: styles.container, screenDescription: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["profile"], ["profile"])))), modui: moderation.ui('profileView'), children: [_jsxs(PagerWithHeader, { testID: "profilePager", isHeaderReady: !showPlaceholder, items: sectionTitles, onPageSelected: onPageSelected, onCurrentPageSelected: onCurrentPageSelected, renderHeader: renderHeader, allowHeaderOverScroll: true, children: [showFiltersTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileLabelsSection, { ref: labelsSectionRef, labelerInfo: labelerInfo, labelerError: labelerError, isLabelerLoading: isLabelerLoading, moderationOpts: moderationOpts, scrollElRef: scrollElRef, headerHeight: headerHeight, isFocused: isFocused, setScrollViewTag: setScrollViewTag }));
                        }
                        : null, showListsTab && !!((_h = profile.associated) === null || _h === void 0 ? void 0 : _h.labeler)
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileLists, { ref: listsSectionRef, did: profile.did, scrollElRef: scrollElRef, headerOffset: headerHeight, enabled: isFocused, setScrollViewTag: setScrollViewTag }));
                        }
                        : null, showPostsTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileFeedSection, { ref: postsSectionRef, feed: "author|".concat(profile.did, "|posts_and_author_threads"), headerHeight: headerHeight, isFocused: isFocused, scrollElRef: scrollElRef, ignoreFilterFor: profile.did, setScrollViewTag: setScrollViewTag, emptyStateMessage: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["No posts yet"], ["No posts yet"])))), emptyStateButton: isMe
                                    ? {
                                        label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Write a post"], ["Write a post"])))),
                                        text: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Write a post"], ["Write a post"])))),
                                        onPress: function () { return openComposer({}); },
                                        size: 'small',
                                        color: 'primary',
                                    }
                                    : undefined }));
                        }
                        : null, showRepliesTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileFeedSection, { ref: repliesSectionRef, feed: "author|".concat(profile.did, "|posts_with_replies"), headerHeight: headerHeight, isFocused: isFocused, scrollElRef: scrollElRef, ignoreFilterFor: profile.did, setScrollViewTag: setScrollViewTag, emptyStateMessage: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["No replies yet"], ["No replies yet"])))), emptyStateIcon: MessageIcon }));
                        }
                        : null, showMediaTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileFeedSection, { ref: mediaSectionRef, feed: "author|".concat(profile.did, "|posts_with_media"), headerHeight: headerHeight, isFocused: isFocused, scrollElRef: scrollElRef, ignoreFilterFor: profile.did, setScrollViewTag: setScrollViewTag, emptyStateMessage: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["No media yet"], ["No media yet"])))), emptyStateButton: isMe
                                    ? {
                                        label: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Post a photo"], ["Post a photo"])))),
                                        text: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Post a photo"], ["Post a photo"])))),
                                        onPress: function () { return openComposer({}); },
                                        size: 'small',
                                        color: 'primary',
                                    }
                                    : undefined, emptyStateIcon: ImageIcon }));
                        }
                        : null, showVideosTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileFeedSection, { ref: videosSectionRef, feed: "author|".concat(profile.did, "|posts_with_video"), headerHeight: headerHeight, isFocused: isFocused, scrollElRef: scrollElRef, ignoreFilterFor: profile.did, setScrollViewTag: setScrollViewTag, emptyStateMessage: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["No video posts yet"], ["No video posts yet"])))), emptyStateButton: isMe
                                    ? {
                                        label: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Post a video"], ["Post a video"])))),
                                        text: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Post a video"], ["Post a video"])))),
                                        onPress: function () { return openComposer({}); },
                                        size: 'small',
                                        color: 'primary',
                                    }
                                    : undefined, emptyStateIcon: VideoIcon }));
                        }
                        : null, showLikesTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileFeedSection, { ref: likesSectionRef, feed: "likes|".concat(profile.did), headerHeight: headerHeight, isFocused: isFocused, scrollElRef: scrollElRef, ignoreFilterFor: profile.did, setScrollViewTag: setScrollViewTag, emptyStateMessage: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["No likes yet"], ["No likes yet"])))), emptyStateIcon: HeartIcon }));
                        }
                        : null, showFeedsTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileFeedgens, { ref: feedsSectionRef, did: profile.did, scrollElRef: scrollElRef, headerOffset: headerHeight, enabled: isFocused, setScrollViewTag: setScrollViewTag }));
                        }
                        : null, showStarterPacksTab
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileStarterPacks, { ref: starterPacksSectionRef, did: profile.did, isMe: isMe, scrollElRef: scrollElRef, headerOffset: headerHeight, enabled: isFocused, setScrollViewTag: setScrollViewTag, emptyStateMessage: isMe
                                    ? _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Starter Packs let you share your favorite feeds and people with your friends."], ["Starter Packs let you share your favorite feeds and people with your friends."]))))
                                    : _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["No Starter Packs yet"], ["No Starter Packs yet"])))), emptyStateButton: isMe
                                    ? {
                                        label: _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Create a Starter Pack"], ["Create a Starter Pack"])))),
                                        text: _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Create a Starter Pack"], ["Create a Starter Pack"])))),
                                        onPress: wrappedNavToWizard,
                                        color: 'primary',
                                        size: 'small',
                                    }
                                    : undefined, emptyStateIcon: CircleAndSquareIcon }));
                        }
                        : null, showListsTab && !((_j = profile.associated) === null || _j === void 0 ? void 0 : _j.labeler)
                        ? function (_a) {
                            var headerHeight = _a.headerHeight, isFocused = _a.isFocused, scrollElRef = _a.scrollElRef;
                            return (_jsx(ProfileLists, { ref: listsSectionRef, did: profile.did, scrollElRef: scrollElRef, headerOffset: headerHeight, enabled: isFocused, setScrollViewTag: setScrollViewTag }));
                        }
                        : null] }), hasSession && (_jsx(FAB, { testID: "composeFAB", onPress: onPressCompose, icon: _jsx(ComposeIcon2, { strokeWidth: 1.5, size: 29, style: s.white }), accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["New post"], ["New post"])))), accessibilityHint: "" }))] }));
}
function useRichText(text) {
    var agent = useAgent();
    var _a = React.useState(text), prevText = _a[0], setPrevText = _a[1];
    var _b = React.useState(function () { return new RichTextAPI({ text: text }); }), rawRT = _b[0], setRawRT = _b[1];
    var _c = React.useState(null), resolvedRT = _c[0], setResolvedRT = _c[1];
    if (text !== prevText) {
        setPrevText(text);
        setRawRT(new RichTextAPI({ text: text }));
        setResolvedRT(null);
        // This will queue an immediate re-render
    }
    React.useEffect(function () {
        var ignore = false;
        function resolveRTFacets() {
            return __awaiter(this, void 0, void 0, function () {
                var resolvedRT;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            resolvedRT = new RichTextAPI({ text: text });
                            return [4 /*yield*/, resolvedRT.detectFacets(agent)];
                        case 1:
                            _a.sent();
                            if (!ignore) {
                                setResolvedRT(resolvedRT);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
        resolveRTFacets();
        return function () {
            ignore = true;
        };
    }, [text, agent]);
    var isResolving = resolvedRT === null;
    return [resolvedRT !== null && resolvedRT !== void 0 ? resolvedRT : rawRT, isResolving];
}
var styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        height: '100%',
        // @ts-ignore Web-only.
        overflowAnchor: 'none', // Fixes jumps when switching tabs while scrolled down.
    },
    loading: {
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    emptyState: {
        paddingVertical: 40,
    },
    loadingMoreFooter: {
        paddingVertical: 20,
    },
    endItem: {
        paddingTop: 20,
        paddingBottom: 30,
        color: colors.gray5,
        textAlign: 'center',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29;
