import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
export function createSanitizedDisplayName(profile, noAt, moderation) {
    if (noAt === void 0) { noAt = false; }
    if (profile.displayName != null && profile.displayName !== '') {
        return sanitizeDisplayName(profile.displayName, moderation);
    }
    else {
        return sanitizeHandle(profile.handle, noAt ? '' : '@');
    }
}
