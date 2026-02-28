import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
var ALLOWED_HOSTS = [
    'bsky.social',
    'bsky.app',
    'staging.bsky.app',
    'staging.bsky.dev',
    'app.staging.bsky.dev',
    'js.hcaptcha.com',
    'newassets.hcaptcha.com',
    'api2.hcaptcha.com',
];
var MIN_DELAY = 3500;
export function CaptchaWebView(_a) {
    var url = _a.url, stateParam = _a.stateParam, state = _a.state, onComplete = _a.onComplete, onSuccess = _a.onSuccess, onError = _a.onError;
    var startedAt = useRef(Date.now());
    var successTo = useRef(undefined);
    useEffect(function () {
        return function () {
            if (successTo.current) {
                clearTimeout(successTo.current);
            }
        };
    }, []);
    var redirectHost = useMemo(function () {
        if (!(state === null || state === void 0 ? void 0 : state.serviceUrl))
            return 'bsky.app';
        return (state === null || state === void 0 ? void 0 : state.serviceUrl) &&
            new URL(state === null || state === void 0 ? void 0 : state.serviceUrl).host === 'staging.bsky.dev'
            ? 'app.staging.bsky.dev'
            : 'bsky.app';
    }, [state === null || state === void 0 ? void 0 : state.serviceUrl]);
    var wasSuccessful = useRef(false);
    var onShouldStartLoadWithRequest = function (event) {
        var urlp = new URL(event.url);
        return ALLOWED_HOSTS.includes(urlp.host);
    };
    var onNavigationStateChange = function (e) {
        if (wasSuccessful.current)
            return;
        var urlp = new URL(e.url);
        if (urlp.host !== redirectHost || urlp.pathname === '/gate/signup')
            return;
        var code = urlp.searchParams.get('code');
        if (urlp.searchParams.get('state') !== stateParam || !code) {
            onError({ error: 'Invalid state or code' });
            return;
        }
        // We want to delay the completion of this screen ever so slightly so that it doesn't appear to be a glitch if it completes too fast
        wasSuccessful.current = true;
        onComplete();
        var now = Date.now();
        var timeTaken = now - startedAt.current;
        if (timeTaken < MIN_DELAY) {
            successTo.current = setTimeout(function () {
                onSuccess(code);
            }, MIN_DELAY - timeTaken);
        }
        else {
            onSuccess(code);
        }
    };
    return (_jsx(WebView, { source: { uri: url }, javaScriptEnabled: true, style: {
            flex: 1,
            backgroundColor: 'transparent',
            borderRadius: 10,
        }, onShouldStartLoadWithRequest: onShouldStartLoadWithRequest, onNavigationStateChange: onNavigationStateChange, scrollEnabled: false, onError: function (e) {
            onError(e.nativeEvent);
        }, onHttpError: function (e) {
            onError(e.nativeEvent);
        } }));
}
