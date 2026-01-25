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
import '#/logger/sentry/setup'; // must be near top
import '#/view/icons';
import './style.css';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import * as Sentry from '@sentry/react-native';
import { QueryProvider } from '#/lib/react-query';
import { ThemeProvider } from '#/lib/ThemeContext';
import I18nProvider from '#/locale/i18nProvider';
import { logger } from '#/logger';
import { Provider as A11yProvider } from '#/state/a11y';
import { Provider as MutedThreadsProvider } from '#/state/cache/thread-mutes';
import { Provider as DialogStateProvider } from '#/state/dialogs';
import { Provider as EmailVerificationProvider } from '#/state/email-verification';
import { listenSessionDropped } from '#/state/events';
import { Provider as HomeBadgeProvider } from '#/state/home-badge';
import { Provider as LightboxStateProvider } from '#/state/lightbox';
import { MessagesProvider } from '#/state/messages';
import { Provider as ModalStateProvider } from '#/state/modals';
import { init as initPersistedState } from '#/state/persisted';
import { Provider as PrefsStateProvider } from '#/state/preferences';
import { Provider as LabelDefsProvider } from '#/state/preferences/label-defs';
import { Provider as ModerationOptsProvider } from '#/state/preferences/moderation-opts';
import { Provider as UnreadNotifsProvider } from '#/state/queries/notifications/unread';
import { Provider as ServiceConfigProvider } from '#/state/service-config';
import { Provider as SessionProvider, useSession, useSessionApi, } from '#/state/session';
import { readLastActiveAccount } from '#/state/session/util';
import { Provider as ShellStateProvider } from '#/state/shell';
import { Provider as ComposerProvider } from '#/state/shell/composer';
import { Provider as LoggedOutViewProvider } from '#/state/shell/logged-out';
import { Provider as OnboardingProvider } from '#/state/shell/onboarding';
import { Provider as ProgressGuideProvider } from '#/state/shell/progress-guide';
import { Provider as SelectedFeedProvider } from '#/state/shell/selected-feed';
import { Provider as StarterPackProvider } from '#/state/shell/starter-pack';
import { Provider as HiddenRepliesProvider } from '#/state/threadgate-hidden-replies';
import * as Toast from '#/view/com/util/Toast';
import { Shell } from '#/view/shell/index';
import { ThemeProvider as Alf } from '#/alf';
import { useColorModeTheme } from '#/alf/util/useColorModeTheme';
import { Provider as ContextMenuProvider } from '#/components/ContextMenu';
import { useStarterPackEntry } from '#/components/hooks/useStarterPackEntry';
import { Provider as IntentDialogProvider } from '#/components/intents/IntentDialogs';
import { Provider as PolicyUpdateOverlayProvider } from '#/components/PolicyUpdateOverlay';
import { Provider as PortalProvider } from '#/components/Portal';
import { Provider as ActiveVideoProvider } from '#/components/Post/Embed/VideoEmbed/ActiveVideoWebContext';
import { Provider as VideoVolumeProvider } from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext';
import { ToastOutlet } from '#/components/Toast';
import { prefetchAgeAssuranceConfig, Provider as AgeAssuranceV2Provider, } from '#/ageAssurance';
import { AnalyticsContext, AnalyticsFeaturesContext, features, setupDeviceId, } from '#/analytics';
import { prefetchLiveEvents, Provider as LiveEventsProvider, } from '#/features/liveEvents/context';
import * as Geo from '#/geolocation';
import { Splash } from '#/Splash';
import { BackgroundNotificationPreferencesProvider } from '../modules/expo-background-notification-handler/src/BackgroundNotificationHandlerProvider';
import { Provider as HideBottomBarBorderProvider } from './lib/hooks/useHideBottomBarBorder';
/**
 * Begin geolocation ASAP
 */
Geo.resolve();
prefetchAgeAssuranceConfig();
prefetchLiveEvents();
function InnerApp() {
    var _a = React.useState(false), isReady = _a[0], setIsReady = _a[1];
    var currentAccount = useSession().currentAccount;
    var resumeSession = useSessionApi().resumeSession;
    var theme = useColorModeTheme();
    var _ = useLingui()._;
    var hasCheckedReferrer = useStarterPackEntry();
    // init
    useEffect(function () {
        function onLaunch(account) {
            return __awaiter(this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, 6, 7]);
                            if (!account) return [3 /*break*/, 2];
                            return [4 /*yield*/, resumeSession(account)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, features.init];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [3 /*break*/, 7];
                        case 5:
                            e_1 = _a.sent();
                            logger.error("session: resumeSession failed", { message: e_1 });
                            return [3 /*break*/, 7];
                        case 6:
                            setIsReady(true);
                            return [7 /*endfinally*/];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        }
        var account = readLastActiveAccount();
        onLaunch(account);
    }, [resumeSession]);
    useEffect(function () {
        return listenSessionDropped(function () {
            Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Sorry! Your session expired. Please sign in again."], ["Sorry! Your session expired. Please sign in again."])))), 'info');
        });
    }, [_]);
    // wait for session to resume
    if (!isReady || !hasCheckedReferrer)
        return _jsx(Splash, { isReady: true });
    return (_jsx(Alf, { theme: theme, children: _jsx(ThemeProvider, { theme: theme, children: _jsx(ContextMenuProvider, { children: _jsx(VideoVolumeProvider, { children: _jsx(ActiveVideoProvider, { children: _jsx(React.Fragment
                        // Resets the entire tree below when it changes:
                        , { children: _jsx(AnalyticsFeaturesContext, { children: _jsx(QueryProvider, { currentDid: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did, children: _jsx(PolicyUpdateOverlayProvider, { children: _jsx(LiveEventsProvider, { children: _jsx(AgeAssuranceV2Provider, { children: _jsx(ComposerProvider, { children: _jsx(MessagesProvider, { children: _jsx(LabelDefsProvider, { children: _jsx(ModerationOptsProvider, { children: _jsx(LoggedOutViewProvider, { children: _jsx(SelectedFeedProvider, { children: _jsx(HiddenRepliesProvider, { children: _jsx(HomeBadgeProvider, { children: _jsx(UnreadNotifsProvider, { children: _jsx(BackgroundNotificationPreferencesProvider, { children: _jsx(MutedThreadsProvider, { children: _jsx(SafeAreaProvider, { children: _jsx(ProgressGuideProvider, { children: _jsx(ServiceConfigProvider, { children: _jsx(EmailVerificationProvider, { children: _jsx(HideBottomBarBorderProvider, { children: _jsxs(IntentDialogProvider, { children: [_jsx(Shell, {}), _jsx(ToastOutlet, {})] }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) }) }) }) }) }));
}
function App() {
    var _a = useState(false), isReady = _a[0], setReady = _a[1];
    React.useEffect(function () {
        Promise.all([initPersistedState(), Geo.resolve(), setupDeviceId]).then(function () {
            return setReady(true);
        });
    }, []);
    if (!isReady) {
        return _jsx(Splash, { isReady: true });
    }
    /*
     * NOTE: only nothing here can depend on other data or session state, since
     * that is set up in the InnerApp component above.
     */
    return (_jsx(Geo.Provider, { children: _jsx(A11yProvider, { children: _jsx(OnboardingProvider, { children: _jsx(AnalyticsContext, { children: _jsx(SessionProvider, { children: _jsx(PrefsStateProvider, { children: _jsx(I18nProvider, { children: _jsx(ShellStateProvider, { children: _jsx(ModalStateProvider, { children: _jsx(DialogStateProvider, { children: _jsx(LightboxStateProvider, { children: _jsx(PortalProvider, { children: _jsx(StarterPackProvider, { children: _jsx(InnerApp, {}) }) }) }) }) }) }) }) }) }) }) }) }) }));
}
export default Sentry.wrap(App);
var templateObject_1;
