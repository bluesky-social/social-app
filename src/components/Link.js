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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { StackActions, } from '@react-navigation/native';
import { BSKY_DOWNLOAD_URL } from '#/lib/constants';
import { useNavigationDeduped } from '#/lib/hooks/useNavigationDeduped';
import { useOpenLink } from '#/lib/hooks/useOpenLink';
import { shareUrl } from '#/lib/sharing';
import { convertBskyAppUrlIfNeeded, createProxiedUrl, isBskyDownloadUrl, isExternalUrl, linkRequiresWarning, } from '#/lib/strings/url-helpers';
import { useModalControls } from '#/state/modals';
import { atoms as a, flatten, useTheme, web } from '#/alf';
import { Button } from '#/components/Button';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { Text } from '#/components/Typography';
import { IS_NATIVE, IS_WEB } from '#/env';
import { router } from '#/routes';
import { useGlobalDialogsControlContext } from './dialogs/Context';
/**
 * Only available within a `Link`, since that inherits from `Button`.
 * `InlineLink` provides no context.
 */
export { useButtonContext as useLinkContext } from '#/components/Button';
export function useLink(_a) {
    var to = _a.to, displayText = _a.displayText, _b = _a.action, action = _b === void 0 ? 'push' : _b, disableMismatchWarning = _a.disableMismatchWarning, outerOnPress = _a.onPress, outerOnLongPress = _a.onLongPress, shareOnLongPress = _a.shareOnLongPress, overridePresentation = _a.overridePresentation, shouldProxy = _a.shouldProxy;
    var navigation = useNavigationDeduped();
    var href = useMemo(function () {
        var _a;
        return typeof to === 'string'
            ? convertBskyAppUrlIfNeeded(sanitizeUrl(to))
            : to.screen
                ? (_a = router.matchName(to.screen)) === null || _a === void 0 ? void 0 : _a.build(to.params)
                : to.href
                    ? convertBskyAppUrlIfNeeded(sanitizeUrl(to.href))
                    : undefined;
    }, [to]);
    if (!href) {
        throw new Error('Could not resolve screen. Link `to` prop must be a string or an object with `screen` and `params` properties');
    }
    var isExternal = isExternalUrl(href);
    var closeModal = useModalControls().closeModal;
    var linkWarningDialogControl = useGlobalDialogsControlContext().linkWarningDialogControl;
    var openLink = useOpenLink();
    var onPress = React.useCallback(function (e) {
        var _a, _b;
        var exitEarlyIfFalse = outerOnPress === null || outerOnPress === void 0 ? void 0 : outerOnPress(e);
        if (exitEarlyIfFalse === false)
            return;
        var requiresWarning = Boolean(!disableMismatchWarning &&
            displayText &&
            isExternal &&
            linkRequiresWarning(href, displayText));
        if (IS_WEB) {
            e.preventDefault();
        }
        if (requiresWarning) {
            linkWarningDialogControl.open({
                displayText: displayText,
                href: href,
            });
        }
        else {
            if (isExternal) {
                openLink(href, overridePresentation, shouldProxy);
            }
            else {
                var shouldOpenInNewTab = shouldClickOpenNewTab(e);
                if (isBskyDownloadUrl(href)) {
                    shareUrl(BSKY_DOWNLOAD_URL);
                }
                else if (shouldOpenInNewTab ||
                    href.startsWith('http') ||
                    href.startsWith('mailto')) {
                    openLink(href);
                }
                else {
                    closeModal(); // close any active modals
                    var _c = router.matchPath(href), screen_1 = _c[0], params = _c[1];
                    // does not apply to web's flat navigator
                    if (IS_NATIVE && screen_1 !== 'NotFound') {
                        var state = navigation.getState();
                        // if screen is not in the current navigator, it means it's
                        // most likely a tab screen. note: state can be undefined
                        if (!((_b = (_a = state === null || state === void 0 ? void 0 : state.routeNames) === null || _a === void 0 ? void 0 : _a.includes) === null || _b === void 0 ? void 0 : _b.call(_a, screen_1))) {
                            var parent_1 = navigation.getParent();
                            if (parent_1 &&
                                parent_1.getState().routeNames.includes("".concat(screen_1, "Tab"))) {
                                // yep, it's a tab screen. i.e. SearchTab
                                // thus we need to navigate to the child screen
                                // via the parent navigator
                                // see https://reactnavigation.org/docs/upgrading-from-6.x/#changes-to-the-navigate-action
                                // TODO: can we support the other kinds of actions? push/replace -sfn
                                // @ts-expect-error include does not narrow the type unfortunately
                                parent_1.navigate("".concat(screen_1, "Tab"), { screen: screen_1, params: params });
                                return;
                            }
                            else {
                                // will probably fail, but let's try anyway
                            }
                        }
                    }
                    if (action === 'push') {
                        navigation.dispatch(StackActions.push(screen_1, params));
                    }
                    else if (action === 'replace') {
                        navigation.dispatch(StackActions.replace(screen_1, params));
                    }
                    else if (action === 'navigate') {
                        // @ts-expect-error not typed
                        navigation.navigate(screen_1, params, { pop: true });
                    }
                    else {
                        throw Error('Unsupported navigator action.');
                    }
                }
            }
        }
    }, [
        outerOnPress,
        disableMismatchWarning,
        displayText,
        isExternal,
        href,
        openLink,
        closeModal,
        action,
        navigation,
        overridePresentation,
        shouldProxy,
        linkWarningDialogControl,
    ]);
    var handleLongPress = React.useCallback(function () {
        var requiresWarning = Boolean(!disableMismatchWarning &&
            displayText &&
            isExternal &&
            linkRequiresWarning(href, displayText));
        if (requiresWarning) {
            linkWarningDialogControl.open({
                displayText: displayText,
                href: href,
                share: true,
            });
        }
        else {
            shareUrl(href);
        }
    }, [
        disableMismatchWarning,
        displayText,
        href,
        isExternal,
        linkWarningDialogControl,
    ]);
    var onLongPress = React.useCallback(function (e) {
        var exitEarlyIfFalse = outerOnLongPress === null || outerOnLongPress === void 0 ? void 0 : outerOnLongPress(e);
        if (exitEarlyIfFalse === false)
            return;
        return IS_NATIVE && shareOnLongPress ? handleLongPress() : undefined;
    }, [outerOnLongPress, handleLongPress, shareOnLongPress]);
    return {
        isExternal: isExternal,
        href: href,
        onPress: onPress,
        onLongPress: onLongPress,
    };
}
/**
 * A interactive element that renders as a `<a>` tag on the web. On mobile it
 * will translate the `href` to navigator screens and params and dispatch a
 * navigation action.
 *
 * Intended to behave as a web anchor tag. For more complex routing, use a
 * `Button`.
 */
export function Link(_a) {
    var children = _a.children, to = _a.to, _b = _a.action, action = _b === void 0 ? 'push' : _b, outerOnPress = _a.onPress, outerOnLongPress = _a.onLongPress, download = _a.download, shouldProxy = _a.shouldProxy, overridePresentation = _a.overridePresentation, rest = __rest(_a, ["children", "to", "action", "onPress", "onLongPress", "download", "shouldProxy", "overridePresentation"]);
    var _c = useLink({
        to: to,
        displayText: typeof children === 'string' ? children : '',
        action: action,
        onPress: outerOnPress,
        onLongPress: outerOnLongPress,
        shouldProxy: shouldProxy,
        overridePresentation: overridePresentation,
    }), href = _c.href, isExternal = _c.isExternal, onPress = _c.onPress, onLongPress = _c.onLongPress;
    return (_jsx(Button, __assign({}, rest, { style: [a.justify_start, rest.style], role: "link", accessibilityRole: "link", href: href, onPress: download ? undefined : onPress, onLongPress: onLongPress }, web({
        hrefAttrs: {
            target: download ? undefined : isExternal ? 'blank' : undefined,
            rel: isExternal ? 'noopener noreferrer' : undefined,
            download: download,
        },
        dataSet: {
            // no underline, only `InlineLink` has underlines
            noUnderline: '1',
        },
    }), { children: children })));
}
export function InlineLinkText(_a) {
    var _b;
    var children = _a.children, to = _a.to, _c = _a.action, action = _c === void 0 ? 'push' : _c, disableMismatchWarning = _a.disableMismatchWarning, style = _a.style, outerOnPress = _a.onPress, outerOnLongPress = _a.onLongPress, download = _a.download, selectable = _a.selectable, label = _a.label, shareOnLongPress = _a.shareOnLongPress, disableUnderline = _a.disableUnderline, overridePresentation = _a.overridePresentation, shouldProxy = _a.shouldProxy, rest = __rest(_a, ["children", "to", "action", "disableMismatchWarning", "style", "onPress", "onLongPress", "download", "selectable", "label", "shareOnLongPress", "disableUnderline", "overridePresentation", "shouldProxy"]);
    var t = useTheme();
    var stringChildren = typeof children === 'string';
    var _d = useLink({
        to: to,
        displayText: stringChildren ? children : '',
        action: action,
        disableMismatchWarning: disableMismatchWarning,
        onPress: outerOnPress,
        onLongPress: outerOnLongPress,
        shareOnLongPress: shareOnLongPress,
        overridePresentation: overridePresentation,
        shouldProxy: shouldProxy,
    }), href = _d.href, isExternal = _d.isExternal, onPress = _d.onPress, onLongPress = _d.onLongPress;
    var _e = useInteractionState(), hovered = _e.state, onHoverIn = _e.onIn, onHoverOut = _e.onOut;
    var flattenedStyle = flatten(style) || {};
    return (_jsx(Text, __assign({ selectable: selectable, accessibilityHint: "", accessibilityLabel: label }, rest, { style: [
            { color: t.palette.primary_500 },
            hovered &&
                !disableUnderline && __assign({}, web({
                outline: 0,
                textDecorationLine: 'underline',
                textDecorationColor: (_b = flattenedStyle.color) !== null && _b !== void 0 ? _b : t.palette.primary_500,
            })),
            flattenedStyle,
        ], role: "link", onPress: download ? undefined : onPress, onLongPress: onLongPress, onMouseEnter: onHoverIn, onMouseLeave: onHoverOut, accessibilityRole: "link", href: href }, web({
        hrefAttrs: {
            target: download ? undefined : isExternal ? 'blank' : undefined,
            rel: isExternal ? 'noopener noreferrer' : undefined,
            download: download,
        },
        dataSet: {
            // default to no underline, apply this ourselves
            noUnderline: '1',
        },
    }), { children: children })));
}
/**
 * A barebones version of `InlineLinkText`, for use outside a
 * `react-navigation` context.
 */
export function SimpleInlineLinkText(_a) {
    var _b;
    var children = _a.children, to = _a.to, style = _a.style, download = _a.download, selectable = _a.selectable, label = _a.label, disableUnderline = _a.disableUnderline, shouldProxy = _a.shouldProxy, outerOnPress = _a.onPress, rest = __rest(_a, ["children", "to", "style", "download", "selectable", "label", "disableUnderline", "shouldProxy", "onPress"]);
    var t = useTheme();
    var _c = useInteractionState(), hovered = _c.state, onHoverIn = _c.onIn, onHoverOut = _c.onOut;
    var flattenedStyle = flatten(style) || {};
    var isExternal = isExternalUrl(to);
    var href = to;
    if (shouldProxy) {
        href = createProxiedUrl(href);
    }
    var onPress = function (e) {
        var exitEarlyIfFalse = outerOnPress === null || outerOnPress === void 0 ? void 0 : outerOnPress(e);
        if (exitEarlyIfFalse === false)
            return;
        Linking.openURL(href);
    };
    return (_jsx(Text, __assign({ selectable: selectable, accessibilityHint: "", accessibilityLabel: label }, rest, { style: [
            { color: t.palette.primary_500 },
            hovered &&
                !disableUnderline && __assign({}, web({
                outline: 0,
                textDecorationLine: 'underline',
                textDecorationColor: (_b = flattenedStyle.color) !== null && _b !== void 0 ? _b : t.palette.primary_500,
            })),
            flattenedStyle,
        ], role: "link", onPress: onPress, onMouseEnter: onHoverIn, onMouseLeave: onHoverOut, accessibilityRole: "link", href: href }, web({
        hrefAttrs: {
            target: download ? undefined : isExternal ? 'blank' : undefined,
            rel: isExternal ? 'noopener noreferrer' : undefined,
            download: download,
        },
        dataSet: {
            // default to no underline, apply this ourselves
            noUnderline: '1',
        },
    }), { children: children })));
}
export function WebOnlyInlineLinkText(_a) {
    var children = _a.children, to = _a.to, onPress = _a.onPress, props = __rest(_a, ["children", "to", "onPress"]);
    return IS_WEB ? (_jsx(InlineLinkText, __assign({}, props, { to: to, onPress: onPress, children: children }))) : (_jsx(Text, __assign({}, props, { children: children })));
}
/**
 * Utility to create a static `onPress` handler for a `Link` that would otherwise link to a URI
 *
 * Example:
 *   `<Link {...createStaticClick(e => {...})} />`
 */
export function createStaticClick(onPressHandler) {
    return {
        to: '#',
        onPress: function (e) {
            e.preventDefault();
            onPressHandler(e);
            return false;
        },
    };
}
/**
 * Utility to create a static `onPress` handler for a `Link`, but only if the
 * click was not modified in some way e.g. `Cmd` or a middle click.
 *
 * On native, this behaves the same as `createStaticClick` because there are no
 * options to "modify" the click in this sense.
 *
 * Example:
 *   `<Link {...createStaticClick(e => {...})} />`
 */
export function createStaticClickIfUnmodified(onPressHandler) {
    return {
        onPress: function (e) {
            if (!IS_WEB || !isModifiedClickEvent(e)) {
                e.preventDefault();
                onPressHandler(e);
                return false;
            }
        },
    };
}
/**
 * Determines if the click event has a meta key pressed, indicating the user
 * intends to deviate from default behavior.
 */
export function isClickEventWithMetaKey(e) {
    if (!IS_WEB)
        return false;
    var event = e;
    return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}
/**
 * Determines if the web click target is anything other than `_self`
 */
export function isClickTargetExternal(e) {
    if (!IS_WEB)
        return false;
    var event = e;
    var el = event.currentTarget;
    return el && el.target && el.target !== '_self';
}
/**
 * Determines if a click event has been modified in some way from its default
 * behavior, e.g. `Cmd` or a middle click.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export function isModifiedClickEvent(e) {
    if (!IS_WEB)
        return false;
    var event = e;
    var isPrimaryButton = event.button === 0;
    return (isClickEventWithMetaKey(e) || isClickTargetExternal(e) || !isPrimaryButton);
}
/**
 * Determines if a click event has been modified in a way that should indiciate
 * that the user intends to open a new tab.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export function shouldClickOpenNewTab(e) {
    if (!IS_WEB)
        return false;
    var event = e;
    var isMiddleClick = IS_WEB && event.button === 1;
    return isClickEventWithMetaKey(e) || isClickTargetExternal(e) || isMiddleClick;
}
