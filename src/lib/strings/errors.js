var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { XRPCError } from '@atproto/xrpc';
import { t } from '@lingui/core/macro';
export function cleanError(str) {
    if (!str) {
        return '';
    }
    if (typeof str !== 'string') {
        str = str.toString();
    }
    if (isNetworkError(str)) {
        return t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Unable to connect. Please check your internet connection and try again."], ["Unable to connect. Please check your internet connection and try again."])));
    }
    if (str.includes('Upstream Failure') ||
        str.includes('NotEnoughResources') ||
        str.includes('pipethrough network error')) {
        return t(templateObject_2 || (templateObject_2 = __makeTemplateObject(["The server appears to be experiencing issues. Please try again in a few moments."], ["The server appears to be experiencing issues. Please try again in a few moments."])));
    }
    /**
     * @see https://github.com/bluesky-social/atproto/blob/255cfcebb54332a7129af768a93004e22c6858e3/packages/pds/src/actor-store/preference/transactor.ts#L24
     */
    if (str.includes('Do not have authorization to set preferences') &&
        str.includes('app.bsky.actor.defs#personalDetailsPref')) {
        return t(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate."], ["You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate."])));
    }
    if (str.includes('Bad token scope') || str.includes('Bad token method')) {
        return t(templateObject_4 || (templateObject_4 = __makeTemplateObject(["This feature is not available while using an App Password. Please sign in with your main password."], ["This feature is not available while using an App Password. Please sign in with your main password."])));
    }
    if (str.includes('Account has been suspended')) {
        return t(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Account has been suspended"], ["Account has been suspended"])));
    }
    if (str.includes('Account is deactivated')) {
        return t(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Account is deactivated"], ["Account is deactivated"])));
    }
    if (str.includes('Profile not found')) {
        return t(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Profile not found"], ["Profile not found"])));
    }
    if (str.includes('Unable to resolve handle')) {
        return t(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Unable to resolve handle"], ["Unable to resolve handle"])));
    }
    if (str.startsWith('Error: ')) {
        return str.slice('Error: '.length);
    }
    return str;
}
var NETWORK_ERRORS = [
    'Abort',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'Upstream service unreachable',
    'NetworkError when attempting to fetch resource',
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
export function isErrorMaybeAppPasswordPermissions(e) {
    if (e instanceof XRPCError && e.error === 'TokenInvalid') {
        return true;
    }
    var str = String(e);
    return str.includes('Bad token scope') || str.includes('Bad token method');
}
/**
 * Intended to capture "User cancelled" or "Crop cancelled" errors
 * that we often get from expo modules such @bsky.app/expo-image-crop-tool
 *
 * The exact name has changed in the past so let's just see if the string
 * contains "cancel"
 */
export function isCancelledError(e) {
    var str = String(e).toLowerCase();
    return str.includes('cancel');
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
