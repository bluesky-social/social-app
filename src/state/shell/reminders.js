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
import { simpleAreDatesEqual } from '#/lib/strings/time';
import { logger } from '#/logger';
import * as persisted from '#/state/persisted';
import { isOnboardingActive } from './onboarding';
export function shouldRequestEmailConfirmation(account) {
    // ignore logged out
    if (!account)
        return false;
    // ignore confirmed accounts, this is the success state of this reminder
    if (account.emailConfirmed)
        return false;
    // wait for onboarding to complete
    if (isOnboardingActive())
        return false;
    var snoozedAt = persisted.get('reminders').lastEmailConfirm;
    var today = new Date();
    logger.debug('Checking email confirmation reminder', {
        today: today,
        snoozedAt: snoozedAt,
    });
    // never been snoozed, new account
    if (!snoozedAt) {
        return true;
    }
    // already snoozed today
    if (simpleAreDatesEqual(new Date(Date.parse(snoozedAt)), new Date())) {
        return false;
    }
    return true;
}
export function snoozeEmailConfirmationPrompt() {
    var lastEmailConfirm = new Date().toISOString();
    logger.debug('Snoozing email confirmation reminder', {
        snoozedAt: lastEmailConfirm,
    });
    persisted.write('reminders', __assign(__assign({}, persisted.get('reminders')), { lastEmailConfirm: lastEmailConfirm }));
}
