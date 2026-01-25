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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useNavigation } from '@react-navigation/native';
import { logger } from '#/logger';
import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileFollowMutationQueue, useProfileQuery, } from '#/state/queries/profile';
import { useRequireAuth } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a, useBreakpoints } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { IS_IOS } from '#/env';
import { GrowthHack } from './GrowthHack';
export function ThreadItemAnchorFollowButton(_a) {
    var did = _a.did, _b = _a.enabled, enabled = _b === void 0 ? true : _b;
    if (IS_IOS) {
        return (_jsx(GrowthHack, { children: _jsx(ThreadItemAnchorFollowButtonInner, { did: did, enabled: enabled }) }));
    }
    return _jsx(ThreadItemAnchorFollowButtonInner, { did: did, enabled: enabled });
}
export function ThreadItemAnchorFollowButtonInner(_a) {
    var did = _a.did, _b = _a.enabled, enabled = _b === void 0 ? true : _b;
    var _c = useProfileQuery({ did: did }), profile = _c.data, isLoading = _c.isLoading;
    // We will never hit this - the profile will always be cached or loaded above
    // but it keeps the typechecker happy
    if (!enabled || isLoading || !profile)
        return null;
    return _jsx(PostThreadFollowBtnLoaded, { profile: profile });
}
function PostThreadFollowBtnLoaded(_a) {
    var _this = this;
    var _b, _c;
    var profileUnshadowed = _a.profile;
    var navigation = useNavigation();
    var _ = useLingui()._;
    var gtMobile = useBreakpoints().gtMobile;
    var profile = useProfileShadow(profileUnshadowed);
    var _d = useProfileFollowMutationQueue(profile, 'PostThreadItem'), queueFollow = _d[0], queueUnfollow = _d[1];
    var requireAuth = useRequireAuth();
    var isFollowing = !!((_b = profile.viewer) === null || _b === void 0 ? void 0 : _b.following);
    var isFollowedBy = !!((_c = profile.viewer) === null || _c === void 0 ? void 0 : _c.followedBy);
    var _e = React.useState(isFollowing), wasFollowing = _e[0], setWasFollowing = _e[1];
    // This prevents the button from disappearing as soon as we follow.
    var showFollowBtn = React.useMemo(function () { return !isFollowing || !wasFollowing; }, [isFollowing, wasFollowing]);
    /**
     * We want this button to stay visible even after following, so that the user can unfollow if they want.
     * However, we need it to disappear after we push to a screen and then come back. We also need it to
     * show up if we view the post while following, go to the profile and unfollow, then come back to the
     * post.
     *
     * We want to update wasFollowing both on blur and on focus so that we hit all these cases. On native,
     * we could do this only on focus because the transition animation gives us time to not notice the
     * sudden rendering of the button. However, on web if we do this, there's an obvious flicker once the
     * button renders. So, we update the state in both cases.
     */
    React.useEffect(function () {
        var updateWasFollowing = function () {
            if (wasFollowing !== isFollowing) {
                setWasFollowing(isFollowing);
            }
        };
        var unsubscribeFocus = navigation.addListener('focus', updateWasFollowing);
        var unsubscribeBlur = navigation.addListener('blur', updateWasFollowing);
        return function () {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [isFollowing, wasFollowing, navigation]);
    var onPress = React.useCallback(function () {
        if (!isFollowing) {
            requireAuth(function () { return __awaiter(_this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, queueFollow()];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _a.sent();
                            if ((e_1 === null || e_1 === void 0 ? void 0 : e_1.name) !== 'AbortError') {
                                logger.error('Failed to follow', { message: String(e_1) });
                                Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_1.toString())), 'xmark');
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
        }
        else {
            requireAuth(function () { return __awaiter(_this, void 0, void 0, function () {
                var e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, queueUnfollow()];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            if ((e_2 === null || e_2 === void 0 ? void 0 : e_2.name) !== 'AbortError') {
                                logger.error('Failed to unfollow', { message: String(e_2) });
                                Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an issue! ", ""], ["There was an issue! ", ""])), e_2.toString())), 'xmark');
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
        }
    }, [isFollowing, requireAuth, queueFollow, _, queueUnfollow]);
    if (!showFollowBtn)
        return null;
    return (_jsxs(Button, { testID: "followBtn", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Follow ", ""], ["Follow ", ""])), profile.handle)), onPress: onPress, size: "small", color: isFollowing ? 'secondary' : 'secondary_inverted', style: [a.rounded_full], children: [gtMobile && (_jsx(ButtonIcon, { icon: isFollowing ? CheckIcon : PlusIcon, size: "sm" })), _jsx(ButtonText, { children: !isFollowing ? (isFollowedBy ? (_jsx(Trans, { children: "Follow back" })) : (_jsx(Trans, { children: "Follow" }))) : (_jsx(Trans, { children: "Following" })) })] }));
}
var templateObject_1, templateObject_2, templateObject_3;
