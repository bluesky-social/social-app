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
import { useMemo } from 'react';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile';
import { useSession } from '#/state/session';
export function useFullVerificationState(_a) {
    var profile = _a.profile;
    var currentAccount = useSession().currentAccount;
    var currentAccountProfile = useCurrentAccountProfile();
    var profileState = useSimpleVerificationState({ profile: profile });
    var viewerState = useSimpleVerificationState({
        profile: currentAccountProfile,
    });
    return useMemo(function () {
        var _a;
        var verifications = ((_a = profile.verification) === null || _a === void 0 ? void 0 : _a.verifications) || [];
        var wasVerified = profileState.role === 'default' &&
            !profileState.isVerified &&
            verifications.length > 0;
        var hasIssuedVerification = Boolean(viewerState &&
            viewerState.role === 'verifier' &&
            profileState.role === 'default' &&
            verifications.find(function (v) { return v.issuer === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did); }));
        return {
            profile: __assign(__assign({}, profileState), { wasVerified: wasVerified, isViewer: profile.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did), showBadge: profileState.showBadge }),
            viewer: viewerState.role === 'verifier'
                ? {
                    role: 'verifier',
                    isVerified: viewerState.isVerified,
                    hasIssuedVerification: hasIssuedVerification,
                }
                : {
                    role: 'default',
                    isVerified: viewerState.isVerified,
                },
        };
    }, [profile, currentAccount, profileState, viewerState]);
}
export function useSimpleVerificationState(_a) {
    var _b;
    var profile = _a.profile;
    var preferences = usePreferencesQuery();
    var prefs = useMemo(function () { var _a; return ((_a = preferences.data) === null || _a === void 0 ? void 0 : _a.verificationPrefs) || { hideBadges: false }; }, [(_b = preferences.data) === null || _b === void 0 ? void 0 : _b.verificationPrefs]);
    return useMemo(function () {
        if (!profile || !profile.verification) {
            return {
                role: 'default',
                isVerified: false,
                showBadge: false,
            };
        }
        var _a = profile.verification, verifiedStatus = _a.verifiedStatus, trustedVerifierStatus = _a.trustedVerifierStatus;
        var isVerifiedUser = ['valid', 'invalid'].includes(verifiedStatus);
        var isVerifierUser = ['valid', 'invalid'].includes(trustedVerifierStatus);
        var isVerified = (isVerifiedUser && verifiedStatus === 'valid') ||
            (isVerifierUser && trustedVerifierStatus === 'valid');
        return {
            role: isVerifierUser ? 'verifier' : 'default',
            isVerified: isVerified,
            showBadge: prefs.hideBadges ? false : isVerified,
        };
    }, [profile, prefs]);
}
