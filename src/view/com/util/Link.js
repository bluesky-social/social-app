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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
import { jsx as _jsx } from "react/jsx-runtime";
import { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, View, } from 'react-native';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { StackActions } from '@react-navigation/native';
import { useNavigationDeduped, } from '#/lib/hooks/useNavigationDeduped';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { getTabState, TabState } from '#/lib/routes/helpers';
import { convertBskyAppUrlIfNeeded, isExternalUrl, linkRequiresWarning, } from '#/lib/strings/url-helpers';
import { emitSoftReset } from '#/state/events';
import { useModalControls } from '#/state/modals';
import { WebAuxClickWrapper } from '#/view/com/util/WebAuxClickWrapper';
import { useTheme } from '#/alf';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { IS_ANDROID, IS_WEB } from '#/env';
import { router } from '../../../routes';
import { PressableWithHover } from './PressableWithHover';
import { Text } from './text/Text';
/**
 * @deprecated use Link from `#/components/Link.tsx` instead
 */
export var Link = memo(function Link(_a) {
    var _b;
    var testID = _a.testID, style = _a.style, href = _a.href, title = _a.title, children = _a.children, noFeedback = _a.noFeedback, asAnchor = _a.asAnchor, accessible = _a.accessible, anchorNoUnderline = _a.anchorNoUnderline, navigationAction = _a.navigationAction, onBeforePress = _a.onBeforePress, accessibilityActions = _a.accessibilityActions, onAccessibilityAction = _a.onAccessibilityAction, dataSetProp = _a.dataSet, props = __rest(_a, ["testID", "style", "href", "title", "children", "noFeedback", "asAnchor", "accessible", "anchorNoUnderline", "navigationAction", "onBeforePress", "accessibilityActions", "onAccessibilityAction", "dataSet"]);
    var t = useTheme();
    var closeModal = useModalControls().closeModal;
    var navigation = useNavigationDeduped();
    var anchorHref = asAnchor ? sanitizeUrl(href) : undefined;
    var openLink = useOpenLink();
    var onPress = useCallback(function (e) {
        onBeforePress === null || onBeforePress === void 0 ? void 0 : onBeforePress();
        if (typeof href === 'string') {
            return onPressInner(closeModal, navigation, sanitizeUrl(href), navigationAction, openLink, e);
        }
    }, [closeModal, navigation, navigationAction, href, openLink, onBeforePress]);
    var accessibilityActionsWithActivate = __spreadArray(__spreadArray([], (accessibilityActions || []), true), [
        { name: 'activate', label: title },
    ], false);
    var dataSet = anchorNoUnderline
        ? __assign(__assign({}, dataSetProp), { noUnderline: 1 }) : dataSetProp;
    if (noFeedback) {
        return (_jsx(WebAuxClickWrapper, { children: _jsx(Pressable, __assign({ testID: testID, onPress: onPress, accessible: accessible, accessibilityRole: "link", accessibilityActions: accessibilityActionsWithActivate, onAccessibilityAction: function (e) {
                    if (e.nativeEvent.actionName === 'activate') {
                        onPress();
                    }
                    else {
                        onAccessibilityAction === null || onAccessibilityAction === void 0 ? void 0 : onAccessibilityAction(e);
                    }
                }, 
                // @ts-ignore web only -sfn
                dataSet: dataSet }, props, { android_ripple: {
                    color: t.atoms.bg_contrast_25.backgroundColor,
                }, unstable_pressDelay: IS_ANDROID ? 90 : undefined, children: _jsx(View, { style: style, href: anchorHref, children: children ? children : _jsx(Text, { children: title || 'link' }) }) })) }));
    }
    var Com = props.hoverStyle ? PressableWithHover : Pressable;
    return (_jsx(Com, __assign({ testID: testID, style: style, onPress: onPress, accessible: accessible, accessibilityRole: "link", accessibilityLabel: (_b = props.accessibilityLabel) !== null && _b !== void 0 ? _b : title, accessibilityHint: props.accessibilityHint, 
        // @ts-ignore web only -prf
        href: anchorHref, dataSet: dataSet }, props, { children: children ? children : _jsx(Text, { children: title || 'link' }) })));
});
/**
 * @deprecated use InlineLinkText from `#/components/Link.tsx` instead
 */
export var TextLink = memo(function TextLink(_a) {
    var testID = _a.testID, _b = _a.type, type = _b === void 0 ? 'md' : _b, style = _a.style, href = _a.href, text = _a.text, numberOfLines = _a.numberOfLines, lineHeight = _a.lineHeight, dataSetProp = _a.dataSet, title = _a.title, onPressProp = _a.onPress, onBeforePress = _a.onBeforePress, disableMismatchWarning = _a.disableMismatchWarning, navigationAction = _a.navigationAction, anchorNoUnderline = _a.anchorNoUnderline, props = __rest(_a, ["testID", "type", "style", "href", "text", "numberOfLines", "lineHeight", "dataSet", "title", "onPress", "onBeforePress", "disableMismatchWarning", "navigationAction", "anchorNoUnderline"]);
    var navigation = useNavigationDeduped();
    var closeModal = useModalControls().closeModal;
    var linkWarningDialogControl = useGlobalDialogsControlContext().linkWarningDialogControl;
    var openLink = useOpenLink();
    if (!disableMismatchWarning && typeof text !== 'string') {
        console.error('Unable to detect mismatching label');
    }
    var dataSet = anchorNoUnderline
        ? __assign(__assign({}, dataSetProp), { noUnderline: 1 }) : dataSetProp;
    var onPress = useCallback(function (e) {
        var _a, _b;
        var requiresWarning = !disableMismatchWarning &&
            linkRequiresWarning(href, typeof text === 'string' ? text : '');
        if (requiresWarning) {
            (_a = e === null || e === void 0 ? void 0 : e.preventDefault) === null || _a === void 0 ? void 0 : _a.call(e);
            linkWarningDialogControl.open({
                displayText: typeof text === 'string' ? text : '',
                href: href,
            });
        }
        if (IS_WEB &&
            href !== '#' &&
            e != null &&
            isModifiedEvent(e)) {
            // Let the browser handle opening in new tab etc.
            return;
        }
        onBeforePress === null || onBeforePress === void 0 ? void 0 : onBeforePress();
        if (onPressProp) {
            (_b = e === null || e === void 0 ? void 0 : e.preventDefault) === null || _b === void 0 ? void 0 : _b.call(e);
            // @ts-expect-error function signature differs by platform -prf
            return onPressProp();
        }
        return onPressInner(closeModal, navigation, sanitizeUrl(href), navigationAction, openLink, e);
    }, [
        onBeforePress,
        onPressProp,
        closeModal,
        navigation,
        href,
        text,
        disableMismatchWarning,
        navigationAction,
        openLink,
        linkWarningDialogControl,
    ]);
    var hrefAttrs = useMemo(function () {
        var isExternal = isExternalUrl(href);
        if (isExternal) {
            return {
                target: '_blank',
                // rel: 'noopener noreferrer',
            };
        }
        return {};
    }, [href]);
    return (_jsx(Text, __assign({ testID: testID, type: type, style: style, numberOfLines: numberOfLines, lineHeight: lineHeight, dataSet: dataSet, title: title, 
        // @ts-ignore web only -prf
        hrefAttrs: hrefAttrs, onPress: onPress, accessibilityRole: "link", href: convertBskyAppUrlIfNeeded(sanitizeUrl(href)) }, props, { children: text })));
});
/**
 * @deprecated use WebOnlyInlineLinkText from `#/components/Link.tsx` instead
 */
export var TextLinkOnWebOnly = memo(function DesktopWebTextLink(_a) {
    var testID = _a.testID, _b = _a.type, type = _b === void 0 ? 'md' : _b, style = _a.style, href = _a.href, text = _a.text, numberOfLines = _a.numberOfLines, lineHeight = _a.lineHeight, navigationAction = _a.navigationAction, disableMismatchWarning = _a.disableMismatchWarning, onBeforePress = _a.onBeforePress, props = __rest(_a, ["testID", "type", "style", "href", "text", "numberOfLines", "lineHeight", "navigationAction", "disableMismatchWarning", "onBeforePress"]);
    if (IS_WEB) {
        return (_jsx(TextLink, __assign({ testID: testID, type: type, style: style, href: href, text: text, numberOfLines: numberOfLines, lineHeight: lineHeight, title: props.title, navigationAction: navigationAction, disableMismatchWarning: disableMismatchWarning, onBeforePress: onBeforePress }, props)));
    }
    return (_jsx(Text, __assign({ testID: testID, type: type, style: style, numberOfLines: numberOfLines, lineHeight: lineHeight, title: props.title }, props, { children: text })));
});
var EXEMPT_PATHS = ['/robots.txt', '/security.txt', '/.well-known/'];
// NOTE
// we can't use the onPress given by useLinkProps because it will
// match most paths to the HomeTab routes while we actually want to
// preserve the tab the app is currently in
//
// we also have some additional behaviors - closing the current modal,
// converting bsky urls, and opening http/s links in the system browser
//
// this method copies from the onPress implementation but adds our
// needed customizations
// -prf
function onPressInner(closeModal, navigation, href, navigationAction, openLink, e) {
    var _a;
    if (closeModal === void 0) { closeModal = function () { }; }
    if (navigationAction === void 0) { navigationAction = 'push'; }
    var shouldHandle = false;
    var isLeftClick = 
    // @ts-ignore Web only -prf
    Platform.OS === 'web' && (e.button == null || e.button === 0);
    // @ts-ignore Web only -prf
    var isMiddleClick = Platform.OS === 'web' && e.button === 1;
    var isMetaKey = 
    // @ts-ignore Web only -prf
    Platform.OS === 'web' && (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
    var newTab = isMetaKey || isMiddleClick;
    if (Platform.OS !== 'web' || !e) {
        shouldHandle = e ? !e.defaultPrevented : true;
    }
    else if (!e.defaultPrevented && // onPress prevented default
        (isLeftClick || isMiddleClick) && // ignore everything but left and middle clicks
        // @ts-ignore Web only -prf
        [undefined, null, '', 'self'].includes((_a = e.currentTarget) === null || _a === void 0 ? void 0 : _a.target) // let browser handle "target=_blank" etc.
    ) {
        e.preventDefault();
        shouldHandle = true;
    }
    if (shouldHandle) {
        href = convertBskyAppUrlIfNeeded(href);
        if (newTab ||
            href.startsWith('http') ||
            href.startsWith('mailto') ||
            EXEMPT_PATHS.some(function (path) { return href.startsWith(path); })) {
            openLink(href);
        }
        else {
            closeModal(); // close any active modals
            var _b = router.matchPath(href), routeName = _b[0], params = _b[1];
            if (navigationAction === 'push') {
                // @ts-ignore we're not able to type check on this one -prf
                navigation.dispatch(StackActions.push(routeName, params));
            }
            else if (navigationAction === 'replace') {
                // @ts-ignore we're not able to type check on this one -prf
                navigation.dispatch(StackActions.replace(routeName, params));
            }
            else if (navigationAction === 'navigate') {
                var state = navigation.getState();
                var tabState = getTabState(state, routeName);
                if (tabState === TabState.InsideAtRoot) {
                    emitSoftReset();
                }
                else {
                    // note: 'navigate' actually acts the same as 'push' nowadays
                    // therefore we need to add 'pop' -sfn
                    // @ts-ignore we're not able to type check on this one -prf
                    navigation.navigate(routeName, params, { pop: true });
                }
            }
            else {
                throw Error('Unsupported navigator action.');
            }
        }
    }
}
function isModifiedEvent(e) {
    var eventTarget = e.currentTarget;
    var target = eventTarget.getAttribute('target');
    return ((target && target !== '_self') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        (e.nativeEvent && e.nativeEvent.which === 2));
}
