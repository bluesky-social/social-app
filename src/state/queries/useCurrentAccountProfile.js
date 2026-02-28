import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';
export function useCurrentAccountProfile() {
    var currentAccount = useSession().currentAccount;
    var profile = useProfileQuery({ did: currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did }).data;
    return useMaybeProfileShadow(profile);
}
