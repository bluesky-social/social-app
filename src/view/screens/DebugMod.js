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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { interpretLabelValueDefinition, LABELS, mock, moderatePost, moderateProfile, RichText, } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useGlobalLabelStrings } from '#/lib/moderation/useGlobalLabelStrings';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { moderationOptsOverrideContext } from '#/state/preferences/moderation-opts';
import { groupNotifications, shouldFilterNotif, } from '#/state/queries/notifications/util';
import { threadPost } from '#/state/queries/usePostThread/views';
import { useSession } from '#/state/session';
import { CenteredView, ScrollView } from '#/view/com/util/Views';
import { ThreadItemAnchor } from '#/screens/PostThread/components/ThreadItemAnchor';
import { ThreadItemPost } from '#/screens/PostThread/components/ThreadItemPost';
import { ProfileHeaderStandard } from '#/screens/Profile/Header/ProfileHeaderStandard';
import { atoms as a, useTheme } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Divider } from '#/components/Divider';
import * as Toggle from '#/components/forms/Toggle';
import * as ToggleButton from '#/components/forms/ToggleButton';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottom, ChevronTop_Stroke2_Corner0_Rounded as ChevronTop, } from '#/components/icons/Chevron';
import * as Layout from '#/components/Layout';
import * as ProfileCard from '#/components/ProfileCard';
import { H1, H3, P, Text } from '#/components/Typography';
import { ScreenHider } from '../../components/moderation/ScreenHider';
import { NotificationFeedItem } from '../com/notifications/NotificationFeedItem';
import { PostFeedItem } from '../com/posts/PostFeedItem';
var LABEL_VALUES = Object.keys(LABELS);
export var DebugModScreen = function (_a) {
    var _b;
    var t = useTheme();
    var _c = React.useState(['label']), scenario = _c[0], setScenario = _c[1];
    var _d = React.useState([]), scenarioSwitches = _d[0], setScenarioSwitches = _d[1];
    var _e = React.useState([LABEL_VALUES[0]]), label = _e[0], setLabel = _e[1];
    var _f = React.useState(['account']), target = _f[0], setTarget = _f[1];
    var _g = React.useState(['warn']), visibility = _g[0], setVisiblity = _g[1];
    var _h = React.useState({
        identifier: 'custom',
        blurs: 'content',
        severity: 'alert',
        defaultSetting: 'warn',
        locales: [
            {
                lang: 'en',
                name: 'Custom label',
                description: 'A custom label created in this test environment',
            },
        ],
    }), customLabelDef = _h[0], setCustomLabelDef = _h[1];
    var _j = React.useState(['post']), view = _j[0], setView = _j[1];
    var labelStrings = useGlobalLabelStrings();
    var currentAccount = useSession().currentAccount;
    var isTargetMe = scenario[0] === 'label' && scenarioSwitches.includes('targetMe');
    var isSelfLabel = scenario[0] === 'label' && scenarioSwitches.includes('selfLabel');
    var noAdult = scenario[0] === 'label' && scenarioSwitches.includes('noAdult');
    var isLoggedOut = scenario[0] === 'label' && scenarioSwitches.includes('loggedOut');
    var isFollowing = scenarioSwitches.includes('following');
    var did = isTargetMe && currentAccount ? currentAccount.did : 'did:web:bob.test';
    var profile = React.useMemo(function () {
        var mockedProfile = mock.profileViewBasic({
            handle: "bob.test",
            displayName: 'Bob Robertson',
            description: 'User with this as their bio',
            labels: scenario[0] === 'label' && target[0] === 'account'
                ? [
                    mock.label({
                        src: isSelfLabel ? did : undefined,
                        val: label[0],
                        uri: "at://".concat(did, "/"),
                    }),
                ]
                : scenario[0] === 'label' && target[0] === 'profile'
                    ? [
                        mock.label({
                            src: isSelfLabel ? did : undefined,
                            val: label[0],
                            uri: "at://".concat(did, "/app.bsky.actor.profile/self"),
                        }),
                    ]
                    : undefined,
            viewer: mock.actorViewerState({
                following: isFollowing
                    ? "at://".concat((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || '', "/app.bsky.graph.follow/1234")
                    : undefined,
                muted: scenario[0] === 'mute',
                mutedByList: undefined,
                blockedBy: undefined,
                blocking: scenario[0] === 'block'
                    ? "at://did:web:alice.test/app.bsky.actor.block/fake"
                    : undefined,
                blockingByList: undefined,
            }),
        });
        mockedProfile.did = did;
        mockedProfile.avatar = 'https://bsky.social/about/images/favicon-32x32.png';
        // @ts-expect-error ProfileViewBasic is close enough -esb
        mockedProfile.banner =
            'https://bsky.social/about/images/social-card-default-gradient.png';
        return mockedProfile;
    }, [scenario, target, label, isSelfLabel, did, isFollowing, currentAccount]);
    var post = React.useMemo(function () {
        return mock.postView({
            record: mock.post({
                text: "This is the body of the post. It's where the text goes. You get the idea.",
            }),
            author: profile,
            labels: scenario[0] === 'label' && target[0] === 'post'
                ? [
                    mock.label({
                        src: isSelfLabel ? did : undefined,
                        val: label[0],
                        uri: "at://".concat(did, "/app.bsky.feed.post/fake"),
                    }),
                ]
                : undefined,
            embed: target[0] === 'embed'
                ? mock.embedRecordView({
                    record: mock.post({
                        text: 'Embed',
                    }),
                    labels: scenario[0] === 'label' && target[0] === 'embed'
                        ? [
                            mock.label({
                                src: isSelfLabel ? did : undefined,
                                val: label[0],
                                uri: "at://".concat(did, "/app.bsky.feed.post/fake"),
                            }),
                        ]
                        : undefined,
                    author: profile,
                })
                : {
                    $type: 'app.bsky.embed.images#view',
                    images: [
                        {
                            thumb: 'https://bsky.social/about/images/social-card-default-gradient.png',
                            fullsize: 'https://bsky.social/about/images/social-card-default-gradient.png',
                            alt: '',
                        },
                    ],
                },
        });
    }, [scenario, label, target, profile, isSelfLabel, did]);
    var replyNotif = React.useMemo(function () {
        var notif = mock.replyNotification({
            record: mock.post({
                text: "This is the body of the post. It's where the text goes. You get the idea.",
                reply: {
                    parent: {
                        uri: "at://".concat(did, "/app.bsky.feed.post/fake-parent"),
                        cid: 'bafyreiclp443lavogvhj3d2ob2cxbfuscni2k5jk7bebjzg7khl3esabwq',
                    },
                    root: {
                        uri: "at://".concat(did, "/app.bsky.feed.post/fake-parent"),
                        cid: 'bafyreiclp443lavogvhj3d2ob2cxbfuscni2k5jk7bebjzg7khl3esabwq',
                    },
                },
            }),
            author: profile,
            labels: scenario[0] === 'label' && target[0] === 'post'
                ? [
                    mock.label({
                        src: isSelfLabel ? did : undefined,
                        val: label[0],
                        uri: "at://".concat(did, "/app.bsky.feed.post/fake"),
                    }),
                ]
                : undefined,
        });
        var item = groupNotifications([notif])[0];
        item.subject = mock.postView({
            record: notif.record,
            author: profile,
            labels: notif.labels,
        });
        return item;
    }, [scenario, label, target, profile, isSelfLabel, did]);
    var followNotif = React.useMemo(function () {
        var notif = mock.followNotification({
            author: profile,
            subjectDid: (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || '',
        });
        var item = groupNotifications([notif])[0];
        return item;
    }, [profile, currentAccount]);
    var modOpts = React.useMemo(function () {
        var _a, _b;
        return {
            userDid: isLoggedOut ? '' : isTargetMe ? did : 'did:web:alice.test',
            prefs: {
                adultContentEnabled: !noAdult,
                labels: (_a = {},
                    _a[label[0]] = visibility[0],
                    _a),
                labelers: [
                    {
                        did: 'did:plc:fake-labeler',
                        labels: (_b = {}, _b[label[0]] = visibility[0], _b),
                    },
                ],
                mutedWords: [],
                hiddenPosts: [],
            },
            labelDefs: {
                'did:plc:fake-labeler': [
                    interpretLabelValueDefinition(customLabelDef, 'did:plc:fake-labeler'),
                ],
            },
        };
    }, [label, visibility, noAdult, isLoggedOut, isTargetMe, did, customLabelDef]);
    var profileModeration = React.useMemo(function () {
        return moderateProfile(profile, modOpts);
    }, [profile, modOpts]);
    var postModeration = React.useMemo(function () {
        return moderatePost(post, modOpts);
    }, [post, modOpts]);
    return (_jsx(Layout.Screen, { children: _jsx(moderationOptsOverrideContext.Provider, { value: modOpts, children: _jsx(ScrollView, { children: _jsxs(CenteredView, { style: [t.atoms.bg, a.px_lg, a.py_lg], children: [_jsx(H1, { style: [a.text_5xl, a.font_semi_bold, a.pb_lg], children: "Moderation states" }), _jsx(Heading, { title: "", subtitle: "Scenario" }), _jsxs(ToggleButton.Group, { label: "Scenario", values: scenario, onChange: setScenario, children: [_jsx(ToggleButton.Button, { name: "label", label: "Label", children: _jsx(ToggleButton.ButtonText, { children: "Label" }) }), _jsx(ToggleButton.Button, { name: "block", label: "Block", children: _jsx(ToggleButton.ButtonText, { children: "Block" }) }), _jsx(ToggleButton.Button, { name: "mute", label: "Mute", children: _jsx(ToggleButton.ButtonText, { children: "Mute" }) })] }), scenario[0] === 'label' && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [
                                        a.border,
                                        a.rounded_sm,
                                        a.mt_lg,
                                        a.mb_lg,
                                        a.p_lg,
                                        t.atoms.border_contrast_medium,
                                    ], children: [_jsx(Toggle.Group, { label: "Toggle", type: "radio", values: label, onChange: setLabel, children: _jsxs(View, { style: [a.flex_row, a.gap_md, a.flex_wrap], children: [LABEL_VALUES.map(function (labelValue) {
                                                        var targetFixed = target[0];
                                                        if (targetFixed !== 'account' &&
                                                            targetFixed !== 'profile') {
                                                            targetFixed = 'content';
                                                        }
                                                        var disabled = isSelfLabel &&
                                                            LABELS[labelValue].flags.includes('no-self');
                                                        return (_jsxs(Toggle.Item, { name: labelValue, label: labelStrings[labelValue].name, disabled: disabled, style: disabled ? { opacity: 0.5 } : undefined, children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: labelValue })] }, labelValue));
                                                    }), _jsxs(Toggle.Item, { name: "custom", label: "Custom label", disabled: isSelfLabel, style: isSelfLabel ? { opacity: 0.5 } : undefined, children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Custom label" })] })] }) }), label[0] === 'custom' ? (_jsx(CustomLabelForm, { def: customLabelDef, setDef: setCustomLabelDef })) : (_jsxs(_Fragment, { children: [_jsx(View, { style: { height: 10 } }), _jsx(Divider, {})] })), _jsx(View, { style: { height: 10 } }), _jsxs(SmallToggler, { label: "Advanced", children: [_jsx(Toggle.Group, { label: "Toggle", type: "checkbox", values: scenarioSwitches, onChange: setScenarioSwitches, children: _jsxs(View, { style: [a.gap_md, a.flex_row, a.flex_wrap, a.pt_md], children: [_jsxs(Toggle.Item, { name: "targetMe", label: "Target is me", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: "Target is me" })] }), _jsxs(Toggle.Item, { name: "following", label: "Following target", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: "Following target" })] }), _jsxs(Toggle.Item, { name: "selfLabel", label: "Self label", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: "Self label" })] }), _jsxs(Toggle.Item, { name: "noAdult", label: "Adult disabled", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: "Adult disabled" })] }), _jsxs(Toggle.Item, { name: "loggedOut", label: "Signed out", children: [_jsx(Toggle.Checkbox, {}), _jsx(Toggle.LabelText, { children: "Signed out" })] })] }) }), ((_b = LABELS[label[0]]) === null || _b === void 0 ? void 0 : _b.configurable) !==
                                                    false && (_jsxs(View, { style: [a.mt_md], children: [_jsx(Text, { style: [
                                                                a.font_semi_bold,
                                                                a.text_xs,
                                                                t.atoms.text,
                                                                a.pb_sm,
                                                            ], children: "Preference" }), _jsx(Toggle.Group, { label: "Preference", type: "radio", values: visibility, onChange: setVisiblity, children: _jsxs(View, { style: [
                                                                    a.flex_row,
                                                                    a.gap_md,
                                                                    a.flex_wrap,
                                                                    a.align_center,
                                                                ], children: [_jsxs(Toggle.Item, { name: "hide", label: "Hide", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Hide" })] }), _jsxs(Toggle.Item, { name: "warn", label: "Warn", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Warn" })] }), _jsxs(Toggle.Item, { name: "ignore", label: "Ignore", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Ignore" })] })] }) })] }))] })] }), _jsx(View, { style: [a.flex_row, a.flex_wrap, a.gap_md], children: _jsxs(View, { children: [_jsx(Text, { style: [
                                                    a.font_semi_bold,
                                                    a.text_xs,
                                                    t.atoms.text,
                                                    a.pl_md,
                                                    a.pb_xs,
                                                ], children: "Target" }), _jsx(View, { style: [
                                                    a.border,
                                                    a.rounded_full,
                                                    a.px_md,
                                                    a.py_sm,
                                                    t.atoms.border_contrast_medium,
                                                    t.atoms.bg,
                                                ], children: _jsx(Toggle.Group, { label: "Target", type: "radio", values: target, onChange: setTarget, children: _jsxs(View, { style: [a.flex_row, a.gap_md, a.flex_wrap], children: [_jsxs(Toggle.Item, { name: "account", label: "Account", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Account" })] }), _jsxs(Toggle.Item, { name: "profile", label: "Profile", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Profile" })] }), _jsxs(Toggle.Item, { name: "post", label: "Post", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Post" })] }), _jsxs(Toggle.Item, { name: "embed", label: "Embed", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Embed" })] })] }) }) })] }) })] })), _jsx(Spacer, {}), _jsx(Heading, { title: "", subtitle: "Results" }), _jsxs(ToggleButton.Group, { label: "Results", values: view, onChange: setView, children: [_jsx(ToggleButton.Button, { name: "post", label: "Post", children: _jsx(ToggleButton.ButtonText, { children: "Post" }) }), _jsx(ToggleButton.Button, { name: "notifications", label: "Notifications", children: _jsx(ToggleButton.ButtonText, { children: "Notifications" }) }), _jsx(ToggleButton.Button, { name: "account", label: "Account", children: _jsx(ToggleButton.ButtonText, { children: "Account" }) }), _jsx(ToggleButton.Button, { name: "data", label: "Data", children: _jsx(ToggleButton.ButtonText, { children: "Data" }) })] }), _jsxs(View, { style: [
                                a.border,
                                a.rounded_sm,
                                a.mt_lg,
                                a.p_md,
                                t.atoms.border_contrast_medium,
                            ], children: [view[0] === 'post' && (_jsxs(_Fragment, { children: [_jsx(Heading, { title: "Post", subtitle: "in feed" }), _jsx(MockPostFeedItem, { post: post, moderation: postModeration }), _jsx(Heading, { title: "Post", subtitle: "viewed directly" }), _jsx(MockPostThreadItem, { post: post, moderationOpts: modOpts }), _jsx(Heading, { title: "Post", subtitle: "reply in thread" }), _jsx(MockPostThreadItem, { post: post, moderationOpts: modOpts, isReply: true })] })), view[0] === 'notifications' && (_jsxs(_Fragment, { children: [_jsx(Heading, { title: "Notification", subtitle: "quote or reply" }), _jsx(MockNotifItem, { notif: replyNotif, moderationOpts: modOpts }), _jsx(View, { style: { height: 20 } }), _jsx(Heading, { title: "Notification", subtitle: "follow or like" }), _jsx(MockNotifItem, { notif: followNotif, moderationOpts: modOpts })] })), view[0] === 'account' && (_jsxs(_Fragment, { children: [_jsx(Heading, { title: "Account", subtitle: "in listing" }), _jsx(MockAccountCard, { profile: profile, moderation: profileModeration }), _jsx(Heading, { title: "Account", subtitle: "viewing directly" }), _jsx(MockAccountScreen, { profile: profile, moderation: profileModeration, moderationOpts: modOpts })] })), view[0] === 'data' && (_jsxs(_Fragment, { children: [_jsx(ModerationUIView, { label: "Profile Moderation UI", mod: profileModeration }), _jsx(ModerationUIView, { label: "Post Moderation UI", mod: postModeration }), _jsx(DataView, { label: label[0], data: LABELS[label[0]] }), _jsx(DataView, { label: "Profile Moderation Data", data: profileModeration }), _jsx(DataView, { label: "Post Moderation Data", data: postModeration })] }))] }), _jsx(View, { style: { height: 400 } })] }) }) }) }));
};
function Heading(_a) {
    var title = _a.title, subtitle = _a.subtitle;
    var t = useTheme();
    return (_jsxs(H3, { style: [a.text_3xl, a.font_semi_bold, a.pb_md], children: [title, ' ', !!subtitle && (_jsx(H3, { style: [t.atoms.text_contrast_medium, a.text_lg], children: subtitle }))] }));
}
function CustomLabelForm(_a) {
    var def = _a.def, setDef = _a.setDef;
    var t = useTheme();
    return (_jsxs(View, { style: [
            a.flex_row,
            a.flex_wrap,
            a.gap_md,
            t.atoms.bg_contrast_25,
            a.rounded_md,
            a.p_md,
            a.mt_md,
        ], children: [_jsxs(View, { children: [_jsx(Text, { style: [a.font_semi_bold, a.text_xs, t.atoms.text, a.pl_md, a.pb_xs], children: "Blurs" }), _jsx(View, { style: [
                            a.border,
                            a.rounded_full,
                            a.px_md,
                            a.py_sm,
                            t.atoms.border_contrast_medium,
                            t.atoms.bg,
                        ], children: _jsx(Toggle.Group, { label: "Blurs", type: "radio", values: [def.blurs], onChange: function (values) { return setDef(function (v) { return (__assign(__assign({}, v), { blurs: values[0] })); }); }, children: _jsxs(View, { style: [a.flex_row, a.gap_md, a.flex_wrap], children: [_jsxs(Toggle.Item, { name: "content", label: "Content", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Content" })] }), _jsxs(Toggle.Item, { name: "media", label: "Media", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Media" })] }), _jsxs(Toggle.Item, { name: "none", label: "None", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "None" })] })] }) }) })] }), _jsxs(View, { children: [_jsx(Text, { style: [a.font_semi_bold, a.text_xs, t.atoms.text, a.pl_md, a.pb_xs], children: "Severity" }), _jsx(View, { style: [
                            a.border,
                            a.rounded_full,
                            a.px_md,
                            a.py_sm,
                            t.atoms.border_contrast_medium,
                            t.atoms.bg,
                        ], children: _jsx(Toggle.Group, { label: "Severity", type: "radio", values: [def.severity], onChange: function (values) { return setDef(function (v) { return (__assign(__assign({}, v), { severity: values[0] })); }); }, children: _jsxs(View, { style: [a.flex_row, a.gap_md, a.flex_wrap, a.align_center], children: [_jsxs(Toggle.Item, { name: "alert", label: "Alert", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Alert" })] }), _jsxs(Toggle.Item, { name: "inform", label: "Inform", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "Inform" })] }), _jsxs(Toggle.Item, { name: "none", label: "None", children: [_jsx(Toggle.Radio, {}), _jsx(Toggle.LabelText, { children: "None" })] })] }) }) })] })] }));
}
function Toggler(_a) {
    var label = _a.label, children = _a.children;
    var t = useTheme();
    var _b = React.useState(false), show = _b[0], setShow = _b[1];
    return (_jsx(View, { style: a.mb_md, children: _jsxs(View, { style: [
                t.atoms.border_contrast_medium,
                a.border,
                a.rounded_sm,
                a.p_xs,
            ], children: [_jsxs(Button, { variant: "solid", color: "secondary", label: "Toggle visibility", size: "small", onPress: function () { return setShow(!show); }, children: [_jsx(ButtonText, { children: label }), _jsx(ButtonIcon, { icon: show ? ChevronTop : ChevronBottom, position: "right" })] }), show && children] }) }));
}
function SmallToggler(_a) {
    var label = _a.label, children = _a.children;
    var _b = React.useState(false), show = _b[0], setShow = _b[1];
    return (_jsxs(View, { children: [_jsx(View, { style: [a.flex_row], children: _jsxs(Button, { variant: "ghost", color: "secondary", label: "Toggle visibility", size: "tiny", onPress: function () { return setShow(!show); }, children: [_jsx(ButtonText, { children: label }), _jsx(ButtonIcon, { icon: show ? ChevronTop : ChevronBottom, position: "right" })] }) }), show && children] }));
}
function DataView(_a) {
    var label = _a.label, data = _a.data;
    return (_jsx(Toggler, { label: label, children: _jsx(Text, { style: [{ fontFamily: 'monospace' }, a.p_md], children: JSON.stringify(data, null, 2) }) }));
}
function ModerationUIView(_a) {
    var mod = _a.mod, label = _a.label;
    return (_jsx(Toggler, { label: label, children: _jsx(View, { style: a.p_lg, children: [
                'profileList',
                'profileView',
                'avatar',
                'banner',
                'displayName',
                'contentList',
                'contentView',
                'contentMedia',
            ].map(function (key) {
                var ui = mod.ui(key);
                return (_jsxs(View, { style: [a.flex_row, a.gap_md], children: [_jsx(Text, { style: [a.font_semi_bold, { width: 100 }], children: key }), _jsx(Flag, { v: ui.filter, label: "Filter" }), _jsx(Flag, { v: ui.blur, label: "Blur" }), _jsx(Flag, { v: ui.alert, label: "Alert" }), _jsx(Flag, { v: ui.inform, label: "Inform" }), _jsx(Flag, { v: ui.noOverride, label: "No-override" })] }, key));
            }) }) }));
}
function Spacer() {
    return _jsx(View, { style: { height: 30 } });
}
function MockPostFeedItem(_a) {
    var post = _a.post, moderation = _a.moderation;
    var t = useTheme();
    if (moderation.ui('contentList').filter) {
        return (_jsx(P, { style: [t.atoms.bg_contrast_25, a.px_lg, a.py_md, a.mb_lg], children: "Filtered from the feed" }));
    }
    return (_jsx(PostFeedItem, { post: post, record: post.record, moderation: moderation, parentAuthor: undefined, showReplyTo: false, reason: undefined, feedContext: '', reqId: undefined, rootPost: post }));
}
function MockPostThreadItem(_a) {
    var post = _a.post, moderationOpts = _a.moderationOpts, isReply = _a.isReply;
    var thread = threadPost({
        uri: post.uri,
        depth: isReply ? 1 : 0,
        value: {
            $type: 'app.bsky.unspecced.defs#threadItemPost',
            post: post,
            moreParents: false,
            moreReplies: 0,
            opThread: false,
            hiddenByThreadgate: false,
            mutedByViewer: false,
        },
        moderationOpts: moderationOpts,
        threadgateHiddenReplies: new Set(),
    });
    return isReply ? (_jsx(ThreadItemPost, { item: thread })) : (_jsx(ThreadItemAnchor, { item: thread }));
}
function MockNotifItem(_a) {
    var notif = _a.notif, moderationOpts = _a.moderationOpts;
    var t = useTheme();
    if (shouldFilterNotif(notif.notification, moderationOpts)) {
        return (_jsx(P, { style: [t.atoms.bg_contrast_25, a.px_lg, a.py_md], children: "Filtered from the feed" }));
    }
    return (_jsx(NotificationFeedItem, { item: notif, moderationOpts: moderationOpts, highlightUnread: true }));
}
function MockAccountCard(_a) {
    var profile = _a.profile, moderation = _a.moderation;
    var t = useTheme();
    var moderationOpts = useModerationOpts();
    if (!moderationOpts)
        return null;
    if (moderation.ui('profileList').filter) {
        return (_jsx(P, { style: [t.atoms.bg_contrast_25, a.px_lg, a.py_md, a.mb_lg], children: "Filtered from the listing" }));
    }
    return _jsx(ProfileCard.Card, { profile: profile, moderationOpts: moderationOpts });
}
function MockAccountScreen(_a) {
    var profile = _a.profile, moderation = _a.moderation, moderationOpts = _a.moderationOpts;
    var t = useTheme();
    var _ = useLingui()._;
    return (_jsx(View, { style: [t.atoms.border_contrast_medium, a.border, a.mb_md], children: _jsx(ScreenHider, { style: {}, screenDescription: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["profile"], ["profile"])))), modui: moderation.ui('profileView'), children: _jsx(ProfileHeaderStandard
            // @ts-ignore ProfileViewBasic is close enough -prf
            , { 
                // @ts-ignore ProfileViewBasic is close enough -prf
                profile: profile, moderationOpts: moderationOpts, 
                // @ts-ignore ProfileViewBasic is close enough -esb
                descriptionRT: new RichText({ text: profile.description }) }) }) }));
}
function Flag(_a) {
    var v = _a.v, label = _a.label;
    var t = useTheme();
    return (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(View, { style: [
                    a.justify_center,
                    a.align_center,
                    a.rounded_xs,
                    a.border,
                    t.atoms.border_contrast_medium,
                    {
                        backgroundColor: t.palette.contrast_25,
                        width: 14,
                        height: 14,
                    },
                ], children: v && _jsx(Check, { size: "xs", fill: t.palette.contrast_900 }) }), _jsx(P, { style: a.text_xs, children: label })] }));
}
var templateObject_1;
