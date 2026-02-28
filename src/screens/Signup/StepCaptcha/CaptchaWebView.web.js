import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { StyleSheet } from 'react-native';
// @ts-ignore web only, we will always redirect to the app on web (CORS)
var REDIRECT_HOST = new URL(window.location.href).host;
export function CaptchaWebView(_a) {
    var url = _a.url, stateParam = _a.stateParam, onSuccess = _a.onSuccess, onError = _a.onError;
    React.useEffect(function () {
        var timeout = setTimeout(function () {
            onError({
                errorMessage: 'User did not complete the captcha within 30 seconds',
            });
        }, 30e3);
        return function () {
            clearTimeout(timeout);
        };
    }, [onError]);
    var onLoad = React.useCallback(function () {
        var _a;
        // @ts-ignore web
        var frame = document.getElementById('captcha-iframe');
        try {
            // @ts-ignore web
            var href = (_a = frame === null || frame === void 0 ? void 0 : frame.contentWindow) === null || _a === void 0 ? void 0 : _a.location.href;
            if (!href)
                return;
            var urlp = new URL(href);
            // This shouldn't happen with CORS protections, but for good measure
            if (urlp.host !== REDIRECT_HOST)
                return;
            var code = urlp.searchParams.get('code');
            if (urlp.searchParams.get('state') !== stateParam || !code) {
                onError({ error: 'Invalid state or code' });
                return;
            }
            onSuccess(code);
        }
        catch (e) {
            // We don't actually want to record an error here, because this will happen quite a bit. We will only be able to
            // get hte href of the iframe if it's on our domain, so all the hcaptcha requests will throw here, although it's
            // harmless. Our other indicators of time-to-complete and back press should be more reliable in catching issues.
        }
    }, [stateParam, onSuccess, onError]);
    return (_jsx("iframe", { src: url, style: styles.iframe, id: "captcha-iframe", onLoad: onLoad }));
}
var styles = StyleSheet.create({
    iframe: {
        flex: 1,
        borderWidth: 0,
        borderRadius: 10,
        backgroundColor: 'transparent',
    },
});
