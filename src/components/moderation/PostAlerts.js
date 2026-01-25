import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getModerationCauseKey, unique } from '#/lib/moderation';
import * as Pills from '#/components/Pills';
export function PostAlerts(_a) {
    var modui = _a.modui, _b = _a.size, size = _b === void 0 ? 'sm' : _b, style = _a.style, additionalCauses = _a.additionalCauses;
    if (!modui.alert && !modui.inform && !(additionalCauses === null || additionalCauses === void 0 ? void 0 : additionalCauses.length)) {
        return null;
    }
    return (_jsxs(Pills.Row, { size: size, style: [size === 'sm' && { marginLeft: -3 }, style], children: [modui.alerts.filter(unique).map(function (cause) { return (_jsx(Pills.Label, { cause: cause, size: size, noBg: size === 'sm' }, getModerationCauseKey(cause))); }), modui.informs.filter(unique).map(function (cause) { return (_jsx(Pills.Label, { cause: cause, size: size, noBg: size === 'sm' }, getModerationCauseKey(cause))); }), additionalCauses === null || additionalCauses === void 0 ? void 0 : additionalCauses.map(function (cause) { return (_jsx(Pills.Label, { cause: cause, size: size, noBg: size === 'sm' }, getModerationCauseKey(cause))); })] }));
}
