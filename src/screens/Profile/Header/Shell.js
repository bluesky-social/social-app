var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useCallback, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { measure, runOnJS, runOnUI, useAnimatedRef, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { utils } from '@bsky.app/alf';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { useActorStatus } from '#/lib/actor-status';
import { BACK_HITSLOP } from '#/lib/constants';
import { useHaptics } from '#/lib/haptics';
import { useLightboxControls } from '#/state/lightbox';
import { useSession } from '#/state/session';
import { LoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { UserBanner } from '#/view/com/util/UserBanner';
import { atoms as a, platform, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon } from '#/components/icons/Arrow';
import { EditLiveDialog } from '#/components/live/EditLiveDialog';
import { LiveIndicator } from '#/components/live/LiveIndicator';
import { LiveStatusDialog } from '#/components/live/LiveStatusDialog';
import { LabelsOnMe } from '#/components/moderation/LabelsOnMe';
import { ProfileHeaderAlerts } from '#/components/moderation/ProfileHeaderAlerts';
import { useAnalytics } from '#/analytics';
import { IS_IOS } from '#/env';
import { GrowableAvatar } from './GrowableAvatar';
import { GrowableBanner } from './GrowableBanner';
import { StatusBarShadow } from './StatusBarShadow';
var ProfileHeaderShell = function (_a) {
    var _b, _c, _d;
    var children = _a.children, profile = _a.profile, moderation = _a.moderation, _e = _a.hideBackButton, hideBackButton = _e === void 0 ? false : _e, isPlaceholderProfile = _a.isPlaceholderProfile;
    var t = useTheme();
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var _ = useLingui()._;
    var openLightbox = useLightboxControls().openLightbox;
    var navigation = useNavigation();
    var topInset = useSafeAreaInsets().top;
    var playHaptic = useHaptics();
    var liveStatusControl = useDialogControl();
    var aviRef = useAnimatedRef();
    var bannerRef = useAnimatedRef();
    var onPressBack = useCallback(function () {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('Home');
        }
    }, [navigation]);
    var _openLightbox = useCallback(function (uri, thumbRect, type) {
        if (type === void 0) { type = 'circle-avi'; }
        openLightbox({
            images: [
                {
                    uri: uri,
                    thumbUri: uri,
                    thumbRect: thumbRect,
                    dimensions: type === 'circle-avi'
                        ? {
                            // It's fine if it's actually smaller but we know it's 1:1.
                            height: 1000,
                            width: 1000,
                        }
                        : {
                            // Banner aspect ratio is 3:1
                            width: 3000,
                            height: 1000,
                        },
                    thumbDimensions: null,
                    type: type,
                },
            ],
            index: 0,
        });
    }, [openLightbox]);
    var isMe = useMemo(function () { return (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === profile.did; }, [currentAccount, profile]);
    var live = useActorStatus(profile);
    useEffect(function () {
        if (live.isActive) {
            ax.metric('live:view:profile', { subject: profile.did });
        }
    }, [ax, live.isActive, profile.did]);
    var onPressAvi = useCallback(function () {
        if (live.isActive) {
            playHaptic('Light');
            ax.metric('live:card:open', { subject: profile.did, from: 'profile' });
            liveStatusControl.open();
        }
        else {
            var modui = moderation.ui('avatar');
            var avatar_1 = profile.avatar;
            if (avatar_1 && !(modui.blur && modui.noOverride)) {
                runOnUI(function () {
                    'worklet';
                    var rect = measure(aviRef);
                    runOnJS(_openLightbox)(avatar_1, rect);
                })();
            }
        }
    }, [
        ax,
        profile,
        moderation,
        _openLightbox,
        aviRef,
        liveStatusControl,
        live,
        playHaptic,
    ]);
    var onPressBanner = useCallback(function () {
        var modui = moderation.ui('banner');
        var banner = profile.banner;
        if (banner && !(modui.blur && modui.noOverride)) {
            runOnUI(function () {
                'worklet';
                var rect = measure(bannerRef);
                runOnJS(_openLightbox)(banner, rect, 'image');
            })();
        }
    }, [profile.banner, moderation, _openLightbox, bannerRef]);
    return (_jsxs(View, { style: t.atoms.bg, pointerEvents: IS_IOS ? 'auto' : 'box-none', children: [_jsxs(View, { pointerEvents: IS_IOS ? 'auto' : 'box-none', style: [a.relative, { height: 150 }], children: [_jsx(StatusBarShadow, {}), _jsx(GrowableBanner, { onPress: isPlaceholderProfile ? undefined : onPressBanner, bannerRef: bannerRef, backButton: !hideBackButton && (_jsx(Button, { testID: "profileHeaderBackBtn", onPress: onPressBack, hitSlop: BACK_HITSLOP, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Back"], ["Back"])))), style: [
                                a.absolute,
                                a.pointer,
                                {
                                    top: platform({
                                        web: 10,
                                        default: topInset,
                                    }),
                                    left: platform({
                                        web: 18,
                                        default: 12,
                                    }),
                                },
                            ], children: function (_a) {
                                var hovered = _a.hovered;
                                return (_jsx(View, { style: [
                                        a.align_center,
                                        a.justify_center,
                                        a.rounded_full,
                                        {
                                            width: 31,
                                            height: 31,
                                            backgroundColor: utils.alpha('#000', 0.5),
                                        },
                                        hovered && {
                                            backgroundColor: utils.alpha('#000', 0.75),
                                        },
                                    ], children: _jsx(ArrowLeftIcon, { size: "lg", fill: "white" }) }));
                            } })), children: isPlaceholderProfile ? (_jsx(LoadingPlaceholder, { width: "100%", height: "100%", style: { borderRadius: 0 } })) : (_jsx(UserBanner, { type: ((_b = profile.associated) === null || _b === void 0 ? void 0 : _b.labeler) ? 'labeler' : 'default', banner: profile.banner, moderation: moderation.ui('banner') })) })] }), children, !isPlaceholderProfile &&
                (isMe ? (_jsx(LabelsOnMe, { type: "account", labels: profile.labels, style: [
                        a.px_lg,
                        a.pt_xs,
                        a.pb_sm,
                        IS_IOS ? a.pointer_events_auto : { pointerEvents: 'box-none' },
                    ] })) : (_jsx(ProfileHeaderAlerts, { moderation: moderation, style: [
                        a.px_lg,
                        a.pt_xs,
                        a.pb_sm,
                        IS_IOS ? a.pointer_events_auto : { pointerEvents: 'box-none' },
                    ] }))), _jsx(GrowableAvatar, { style: [a.absolute, { top: 104, left: 10 }], children: _jsx(Pressable, { testID: "profileHeaderAviButton", onPress: onPressAvi, accessibilityRole: "image", accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["View ", "'s avatar"], ["View ", "'s avatar"])), profile.handle)), accessibilityHint: "", children: _jsx(View, { style: [
                            t.atoms.bg,
                            a.rounded_full,
                            {
                                width: 94,
                                height: 94,
                                borderWidth: live.isActive ? 3 : 2,
                                borderColor: live.isActive
                                    ? t.palette.negative_500
                                    : t.atoms.bg.backgroundColor,
                            },
                            ((_c = profile.associated) === null || _c === void 0 ? void 0 : _c.labeler) && a.rounded_md,
                        ], children: _jsxs(Animated.View, { ref: aviRef, collapsable: false, children: [_jsx(UserAvatar, { type: ((_d = profile.associated) === null || _d === void 0 ? void 0 : _d.labeler) ? 'labeler' : 'user', size: live.isActive ? 88 : 90, avatar: profile.avatar, moderation: moderation.ui('avatar'), noBorder: true }), live.isActive && _jsx(LiveIndicator, { size: "large" })] }) }) }) }), live.isActive &&
                (isMe ? (_jsx(EditLiveDialog, { control: liveStatusControl, status: live, embed: live.embed })) : (_jsx(LiveStatusDialog, { control: liveStatusControl, status: live, embed: live.embed, profile: profile })))] }));
};
ProfileHeaderShell = memo(ProfileHeaderShell);
export { ProfileHeaderShell };
var templateObject_1, templateObject_2;
