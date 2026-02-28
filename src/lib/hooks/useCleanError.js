var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useCallback } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
export function useCleanError() {
    var _ = useLingui()._;
    return useCallback(function (error) {
        if (!error)
            return {
                raw: undefined,
                clean: undefined,
            };
        var raw = error.toString();
        if (isNetworkError(raw)) {
            return {
                raw: raw,
                clean: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Unable to connect. Please check your internet connection and try again."], ["Unable to connect. Please check your internet connection and try again."])))),
            };
        }
        if (raw.includes('Upstream Failure') ||
            raw.includes('NotEnoughResources') ||
            raw.includes('pipethrough network error')) {
            return {
                raw: raw,
                clean: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["The server appears to be experiencing issues. Please try again in a few moments."], ["The server appears to be experiencing issues. Please try again in a few moments."])))),
            };
        }
        /**
         * @see https://github.com/bluesky-social/atproto/blob/255cfcebb54332a7129af768a93004e22c6858e3/packages/pds/src/actor-store/preference/transactor.ts#L24
         */
        if (raw.includes('Do not have authorization to set preferences') &&
            raw.includes('app.bsky.actor.defs#personalDetailsPref')) {
            return {
                raw: raw,
                clean: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate."], ["You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate."])))),
            };
        }
        if (raw.includes('Bad token scope') || raw.includes('Bad token method')) {
            return {
                raw: raw,
                clean: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["This feature is not available while using an app password. Please sign in with your main password."], ["This feature is not available while using an app password. Please sign in with your main password."])))),
            };
        }
        if (raw.includes('Rate Limit Exceeded')) {
            return {
                raw: raw,
                clean: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["You've reached the maximum number of requests allowed. Please try again later."], ["You've reached the maximum number of requests allowed. Please try again later."])))),
            };
        }
        if (raw.startsWith('Error: ')) {
            raw = raw.slice('Error: '.length);
        }
        return {
            raw: raw,
            clean: undefined,
        };
    }, [_]);
}
var NETWORK_ERRORS = [
    'Abort',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'Upstream service unreachable',
];
export function isNetworkError(e) {
    var str = String(e);
    for (var _i = 0, NETWORK_ERRORS_1 = NETWORK_ERRORS; _i < NETWORK_ERRORS_1.length; _i++) {
        var err = NETWORK_ERRORS_1[_i];
        if (str.includes(err)) {
            return true;
        }
    }
    return false;
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
