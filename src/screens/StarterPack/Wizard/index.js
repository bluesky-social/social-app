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
import React from 'react';
import { Keyboard, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AtUri, } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { STARTER_PACK_MAX_SIZE } from '#/lib/constants';
import { useEnableKeyboardControllerScreen } from '#/lib/hooks/useEnableKeyboardController';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { enforceLen } from '#/lib/strings/helpers';
import { getStarterPackOgCard, parseStarterPackUri, } from '#/lib/strings/starter-pack';
import { logger } from '#/logger';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useAllListMembersQuery } from '#/state/queries/list-members';
import { useProfileQuery } from '#/state/queries/profile';
import { useCreateStarterPackMutation, useEditStarterPackMutation, useStarterPackQuery, } from '#/state/queries/starter-packs';
import { useSession } from '#/state/session';
import { useSetMinimalShellMode } from '#/state/shell';
import * as Toast from '#/view/com/util/Toast';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { useWizardState, } from '#/screens/StarterPack/Wizard/State';
import { StepDetails } from '#/screens/StarterPack/Wizard/StepDetails';
import { StepFeeds } from '#/screens/StarterPack/Wizard/StepFeeds';
import { StepProfiles } from '#/screens/StarterPack/Wizard/StepProfiles';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import * as Layout from '#/components/Layout';
import { ListMaybePlaceholder } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import { WizardEditListDialog } from '#/components/StarterPack/Wizard/WizardEditListDialog';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { Provider } from './State';
export function Wizard(_a) {
    var _b, _c;
    var route = _a.route;
    var params = (_b = route.params) !== null && _b !== void 0 ? _b : {};
    var rkey = 'rkey' in params ? params.rkey : undefined;
    var fromDialog = 'fromDialog' in params ? params.fromDialog : false;
    var targetDid = 'targetDid' in params ? params.targetDid : undefined;
    var onSuccess = 'onSuccess' in params ? params.onSuccess : undefined;
    var currentAccount = useSession().currentAccount;
    var moderationOpts = useModerationOpts();
    var _ = useLingui()._;
    // Use targetDid if provided (from dialog), otherwise use current account
    var profileDid = targetDid || currentAccount.did;
    var _d = useStarterPackQuery({ did: currentAccount.did, rkey: rkey }), starterPack = _d.data, isLoadingStarterPack = _d.isLoading, isErrorStarterPack = _d.isError;
    var listUri = (_c = starterPack === null || starterPack === void 0 ? void 0 : starterPack.list) === null || _c === void 0 ? void 0 : _c.uri;
    var _e = useAllListMembersQuery(listUri), listItems = _e.data, isLoadingProfiles = _e.isLoading, isErrorProfiles = _e.isError;
    var _f = useProfileQuery({ did: profileDid }), profile = _f.data, isLoadingProfile = _f.isLoading, isErrorProfile = _f.isError;
    var isEdit = Boolean(rkey);
    var isReady = (!isEdit || (isEdit && starterPack && listItems)) &&
        profile &&
        moderationOpts;
    if (!isReady) {
        return (_jsx(Layout.Screen, { children: _jsx(ListMaybePlaceholder, { isLoading: isLoadingStarterPack || isLoadingProfiles || isLoadingProfile, isError: isErrorStarterPack || isErrorProfiles || isErrorProfile, errorMessage: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["That starter pack could not be found."], ["That starter pack could not be found."])))) }) }));
    }
    else if (isEdit && (starterPack === null || starterPack === void 0 ? void 0 : starterPack.creator.did) !== (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
        return (_jsx(Layout.Screen, { children: _jsx(ListMaybePlaceholder, { isLoading: false, isError: true, errorMessage: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["That starter pack could not be found."], ["That starter pack could not be found."])))) }) }));
    }
    return (_jsx(Layout.Screen, { testID: "starterPackWizardScreen", style: web([{ minHeight: 0 }, a.flex_1]), children: _jsx(Provider, { starterPack: starterPack, listItems: listItems, targetProfile: profile, children: _jsx(WizardInner, { currentStarterPack: starterPack, currentListItems: listItems, profile: profile, moderationOpts: moderationOpts, fromDialog: fromDialog, onSuccess: onSuccess }) }) }));
}
function WizardInner(_a) {
    var _this = this;
    var currentStarterPack = _a.currentStarterPack, currentListItems = _a.currentListItems, profile = _a.profile, moderationOpts = _a.moderationOpts, fromDialog = _a.fromDialog, onSuccess = _a.onSuccess;
    var navigation = useNavigation();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var _b = useWizardState(), state = _b[0], dispatch = _b[1];
    var currentAccount = useSession().currentAccount;
    var currentProfile = useProfileQuery({
        did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        staleTime: 0,
    }).data;
    var parsed = parseStarterPackUri(currentStarterPack === null || currentStarterPack === void 0 ? void 0 : currentStarterPack.uri);
    React.useEffect(function () {
        navigation.setOptions({
            gestureEnabled: false,
        });
    }, [navigation]);
    useEnableKeyboardControllerScreen(true);
    useFocusEffect(React.useCallback(function () {
        setMinimalShellMode(true);
        return function () {
            setMinimalShellMode(false);
        };
    }, [setMinimalShellMode]));
    var getDefaultName = function () {
        var displayName = createSanitizedDisplayName(currentProfile, true);
        return _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", "'s Starter Pack"], ["", "'s Starter Pack"])), displayName)).slice(0, 50);
    };
    var wizardUiStrings = {
        Details: {
            header: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Starter Pack"], ["Starter Pack"])))),
            nextBtn: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Next"], ["Next"])))),
        },
        Profiles: {
            header: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Choose People"], ["Choose People"])))),
            nextBtn: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Next"], ["Next"])))),
        },
        Feeds: {
            header: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Choose Feeds"], ["Choose Feeds"])))),
            nextBtn: state.feeds.length === 0 ? _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Skip"], ["Skip"])))) : _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Finish"], ["Finish"])))),
        },
    };
    var currUiStrings = wizardUiStrings[state.currentStep];
    var onSuccessCreate = function (data) {
        var rkey = new AtUri(data.uri).rkey;
        ax.metric('starterPack:create', {
            setName: state.name != null,
            setDescription: state.description != null,
            profilesCount: state.profiles.length,
            feedsCount: state.feeds.length,
        });
        Image.prefetch([getStarterPackOgCard(currentProfile.did, rkey)]);
        dispatch({ type: 'SetProcessing', processing: false });
        if (fromDialog) {
            navigation.goBack();
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        }
        else {
            navigation.replace('StarterPack', {
                name: profile.handle,
                rkey: rkey,
                new: true,
            });
        }
    };
    var onSuccessEdit = function () {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.replace('StarterPack', {
                name: currentAccount.handle,
                rkey: parsed.rkey,
            });
        }
    };
    var createStarterPack = useCreateStarterPackMutation({
        onSuccess: onSuccessCreate,
        onError: function (e) {
            logger.error('Failed to create starter pack', { safeMessage: e });
            dispatch({ type: 'SetProcessing', processing: false });
            Toast.show(_(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Failed to create starter pack"], ["Failed to create starter pack"])))), 'xmark');
        },
    }).mutate;
    var editStarterPack = useEditStarterPackMutation({
        onSuccess: onSuccessEdit,
        onError: function (e) {
            logger.error('Failed to edit starter pack', { safeMessage: e });
            dispatch({ type: 'SetProcessing', processing: false });
            Toast.show(_(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Failed to create starter pack"], ["Failed to create starter pack"])))), 'xmark');
        },
    }).mutate;
    var submit = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            dispatch({ type: 'SetProcessing', processing: true });
            if (currentStarterPack && currentListItems) {
                editStarterPack({
                    name: ((_a = state.name) === null || _a === void 0 ? void 0 : _a.trim()) || getDefaultName(),
                    description: (_b = state.description) === null || _b === void 0 ? void 0 : _b.trim(),
                    profiles: state.profiles,
                    feeds: state.feeds,
                    currentStarterPack: currentStarterPack,
                    currentListItems: currentListItems,
                });
            }
            else {
                createStarterPack({
                    name: ((_c = state.name) === null || _c === void 0 ? void 0 : _c.trim()) || getDefaultName(),
                    description: (_d = state.description) === null || _d === void 0 ? void 0 : _d.trim(),
                    profiles: state.profiles,
                    feeds: state.feeds,
                });
            }
            return [2 /*return*/];
        });
    }); };
    var onNext = function () {
        if (state.currentStep === 'Feeds') {
            submit();
            return;
        }
        var keyboardVisible = Keyboard.isVisible();
        Keyboard.dismiss();
        setTimeout(function () {
            dispatch({ type: 'Next' });
        }, keyboardVisible ? 16 : 0);
    };
    var items = state.currentStep === 'Profiles' ? state.profiles : state.feeds;
    var isEditEnabled = (state.currentStep === 'Profiles' && items.length > 1) ||
        (state.currentStep === 'Feeds' && items.length > 0);
    var editDialogControl = useDialogControl();
    return (_jsxs(Layout.Center, { style: [a.flex_1], children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, { label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Back"], ["Back"])))), accessibilityHint: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Returns to the previous step"], ["Returns to the previous step"])))), onPress: function (evt) {
                            if (state.currentStep !== 'Details') {
                                evt.preventDefault();
                                dispatch({ type: 'Back' });
                            }
                        } }), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: currUiStrings.header }) }), isEditEnabled ? (_jsx(Button, { label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Edit"], ["Edit"])))), color: "secondary", size: "small", onPress: editDialogControl.open, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Edit" }) }) })) : (_jsx(Layout.Header.Slot, {}))] }), _jsx(Container, { children: state.currentStep === 'Details' ? (_jsx(StepDetails, {})) : state.currentStep === 'Profiles' ? (_jsx(StepProfiles, { moderationOpts: moderationOpts })) : state.currentStep === 'Feeds' ? (_jsx(StepFeeds, { moderationOpts: moderationOpts })) : null }), state.currentStep !== 'Details' && (_jsx(Footer, { onNext: onNext, nextBtnText: currUiStrings.nextBtn })), _jsx(WizardEditListDialog, { control: editDialogControl, state: state, dispatch: dispatch, moderationOpts: moderationOpts, profile: profile })] }));
}
function Container(_a) {
    var children = _a.children;
    var _ = useLingui()._;
    var _b = useWizardState(), state = _b[0], dispatch = _b[1];
    if (state.currentStep === 'Profiles' || state.currentStep === 'Feeds') {
        return _jsx(View, { style: [a.flex_1], children: children });
    }
    return (_jsxs(KeyboardAwareScrollView, { style: [a.flex_1], keyboardShouldPersistTaps: "handled", children: [children, state.currentStep === 'Details' && (_jsx(_Fragment, { children: _jsx(Button, { label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Next"], ["Next"])))), variant: "solid", color: "primary", size: "large", style: [a.mx_xl, a.mb_lg, { marginTop: 35 }], onPress: function () { return dispatch({ type: 'Next' }); }, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Next" }) }) }) }))] }));
}
function Footer(_a) {
    var onNext = _a.onNext, nextBtnText = _a.nextBtnText;
    var t = useTheme();
    var state = useWizardState()[0];
    var bottomInset = useSafeAreaInsets().bottom;
    var currentAccount = useSession().currentAccount;
    var items = state.currentStep === 'Profiles' ? state.profiles : state.feeds;
    var minimumItems = state.currentStep === 'Profiles' ? 8 : 0;
    var textStyles = [a.text_md];
    return (_jsxs(View, { style: [
            a.border_t,
            a.align_center,
            a.px_lg,
            a.pt_xl,
            a.gap_md,
            t.atoms.bg,
            t.atoms.border_contrast_medium,
            {
                paddingBottom: a.pb_lg.paddingBottom + bottomInset,
            },
            IS_NATIVE && [
                a.border_l,
                a.border_r,
                t.atoms.shadow_md,
                {
                    borderTopLeftRadius: 14,
                    borderTopRightRadius: 14,
                },
            ],
        ], children: [items.length > minimumItems && (_jsx(View, { style: [a.absolute, { right: 14, top: 31 }], children: _jsxs(Text, { style: [a.font_semi_bold], children: [items.length, "/", state.currentStep === 'Profiles' ? STARTER_PACK_MAX_SIZE : 3] }) })), _jsx(View, { style: [a.flex_row], children: items.slice(0, 6).map(function (p, index) { return (_jsx(View, { style: [
                        a.rounded_full,
                        {
                            borderWidth: 0.5,
                            borderColor: t.atoms.bg.backgroundColor,
                        },
                        state.currentStep === 'Profiles'
                            ? { zIndex: 1 - index, marginLeft: index > 0 ? -8 : 0 }
                            : { marginRight: 4 },
                    ], children: _jsx(UserAvatar, { avatar: p.avatar, size: 32, type: state.currentStep === 'Profiles' ? 'user' : 'algo' }) }, index)); }) }), state.currentStep === 'Profiles' ? (_jsx(Text, { style: [a.text_center, textStyles], children: items.length < 2 ? ((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === items[0].did ? (_jsx(Trans, { children: "It's just you right now! Add more people to your starter pack by searching above." })) : (_jsxs(Trans, { children: ["It's just", ' ', _jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[0]), ' '] }), "right now! Add more people to your starter pack by searching above."] }))) : items.length === 2 ? ((currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === items[0].did ? (_jsxs(Trans, { children: [_jsx(Text, { style: [a.font_semi_bold, textStyles], children: "You" }), " and", _jsx(Text, { children: " " }), _jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[1] /* [0] is self, skip it */), ' '] }), "are included in your starter pack"] })) : (_jsxs(Trans, { children: [_jsx(Text, { style: [a.font_semi_bold, textStyles], children: getName(items[0]) }), ' ', "and", _jsx(Text, { children: " " }), _jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[1] /* [0] is self, skip it */), ' '] }), "are included in your starter pack"] }))) : items.length > 2 ? (_jsxs(Trans, { context: "profiles", children: [_jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[1] /* [0] is self, skip it */), ",", ' '] }), _jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[2]), ",", ' '] }), "and", ' ', _jsx(Plural, { value: items.length - 2, one: "# other", other: "# others" }), ' ', "are included in your starter pack"] })) : null /* Should not happen. */ })) : state.currentStep === 'Feeds' ? (items.length === 0 ? (_jsxs(View, { style: [a.gap_sm], children: [_jsx(Text, { style: [a.font_semi_bold, a.text_center, textStyles], children: _jsx(Trans, { children: "Add some feeds to your starter pack!" }) }), _jsx(Text, { style: [a.text_center, textStyles], children: _jsx(Trans, { children: "Search for feeds that you want to suggest to others." }) })] })) : (_jsx(Text, { style: [a.text_center, textStyles], children: items.length === 1 ? (_jsxs(Trans, { children: [_jsx(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: getName(items[0]) }), ' ', "is included in your starter pack"] })) : items.length === 2 ? (_jsxs(Trans, { children: [_jsx(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: getName(items[0]) }), ' ', "and", _jsx(Text, { children: " " }), _jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[1]), ' '] }), "are included in your starter pack"] })) : items.length > 2 ? (_jsxs(Trans, { context: "feeds", children: [_jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[0]), ",", ' '] }), _jsxs(Text, { style: [a.font_semi_bold, textStyles], emoji: true, children: [getName(items[1]), ",", ' '] }), "and", ' ', _jsx(Plural, { value: items.length - 2, one: "# other", other: "# others" }), ' ', "are included in your starter pack"] })) : null /* Should not happen. */ }))) : null /* Should not happen. */, _jsxs(View, { style: [
                    a.w_full,
                    a.align_center,
                    a.gap_2xl,
                    IS_NATIVE ? a.mt_sm : a.mt_md,
                ], children: [state.currentStep === 'Profiles' && items.length < 8 && (_jsx(Text, { style: [
                            a.font_semi_bold,
                            textStyles,
                            t.atoms.text_contrast_medium,
                        ], children: _jsxs(Trans, { children: ["Add ", 8 - items.length, " more to continue"] }) })), _jsxs(Button, { label: nextBtnText, style: [a.w_full, a.py_md, a.px_2xl], color: "primary", size: "large", onPress: onNext, disabled: !state.canNext ||
                            state.processing ||
                            (state.currentStep === 'Profiles' && items.length < 8), children: [_jsx(ButtonText, { children: nextBtnText }), state.processing && _jsx(ButtonIcon, { icon: Loader })] })] })] }));
}
function getName(item) {
    if (typeof item.displayName === 'string') {
        return enforceLen(sanitizeDisplayName(item.displayName), 28, true);
    }
    else if ('handle' in item && typeof item.handle === 'string') {
        return enforceLen(sanitizeHandle(item.handle), 28, true);
    }
    return '';
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;
