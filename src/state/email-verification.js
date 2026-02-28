import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { BSKY_SERVICE } from '#/lib/constants';
import { getHostnameFromUrl } from '#/lib/strings/url-helpers';
import { STALE } from '#/state/queries';
import { useProfileQuery } from '#/state/queries/profile';
import { useCheckEmailConfirmed } from '#/state/service-config';
import { useSession } from '#/state/session';
var EmailVerificationContext = createContext(null);
EmailVerificationContext.displayName = 'EmailVerificationContext';
export function Provider(_a) {
    var children = _a.children;
    var currentAccount = useSession().currentAccount;
    var profile = useProfileQuery({
        did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
        staleTime: STALE.INFINITY,
    }).data;
    var checkEmailConfirmed = useCheckEmailConfirmed();
    // Date set for 11 AM PST on the 18th of November
    var isNewEnough = !!(profile === null || profile === void 0 ? void 0 : profile.createdAt) &&
        Date.parse(profile.createdAt) >= Date.parse('2024-11-18T19:00:00.000Z');
    var isSelfHost = currentAccount &&
        getHostnameFromUrl(currentAccount.service) !==
            getHostnameFromUrl(BSKY_SERVICE);
    var needsEmailVerification = !isSelfHost &&
        checkEmailConfirmed &&
        !(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.emailConfirmed) &&
        isNewEnough;
    var value = useMemo(function () { return ({ needsEmailVerification: needsEmailVerification }); }, [needsEmailVerification]);
    return (_jsx(EmailVerificationContext.Provider, { value: value, children: children }));
}
Provider.displayName = 'EmailVerificationProvider';
export function useEmail() {
    var ctx = useContext(EmailVerificationContext);
    if (!ctx) {
        throw new Error('useEmail must be used within a EmailVerificationProvider');
    }
    return ctx;
}
