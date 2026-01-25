import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
export function getUserDisplayName(props) {
    return sanitizeDisplayName(props.displayName || sanitizeHandle(props.handle, '@'));
}
