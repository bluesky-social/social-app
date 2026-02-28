var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useCallback } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useSession } from '#/state/session';
export var ZENDESK_SUPPORT_URL = 'https://blueskyweb.zendesk.com/hc/requests/new';
export var SupportCode;
(function (SupportCode) {
    SupportCode["AA_DID"] = "AA_DID";
    SupportCode["AA_BIRTHDATE"] = "AA_BIRTHDATE";
})(SupportCode || (SupportCode = {}));
/**
 * {@link https://support.zendesk.com/hc/en-us/articles/4408839114522-Creating-pre-filled-ticket-forms}
 */
export function useCreateSupportLink() {
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    return useCallback(function (_a) {
        var code = _a.code, email = _a.email;
        var url = new URL(ZENDESK_SUPPORT_URL);
        if (currentAccount) {
            url.search = new URLSearchParams({
                tf_anonymous_requester_email: email || currentAccount.email || '', // email will be defined
                tf_description: "[Code: ".concat(code, "] \u2014 ") + _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Please write your message below:"], ["Please write your message below:"])))),
                /**
                 * Custom field specific to {@link ZENDESK_SUPPORT_URL} form
                 */
                tf_17205412673421: currentAccount.handle + " (".concat(currentAccount.did, ")"),
            }).toString();
        }
        return url.toString();
    }, [_, currentAccount]);
}
var templateObject_1;
