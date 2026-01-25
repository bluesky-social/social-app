import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getModerationCauseKey, unique } from '#/lib/moderation';
import * as Pills from '#/components/Pills';
export function ProfileHeaderAlerts(_a) {
    var moderation = _a.moderation, style = _a.style;
    var modui = moderation.ui('profileView');
    if (!modui.alert && !modui.inform) {
        return null;
    }
    return (_jsxs(Pills.Row, { size: "lg", style: style, children: [modui.alerts.filter(unique).map(function (cause) { return (_jsx(Pills.Label, { size: "lg", cause: cause }, getModerationCauseKey(cause))); }), modui.informs.filter(unique).map(function (cause) { return (_jsx(Pills.Label, { size: "lg", cause: cause }, getModerationCauseKey(cause))); })] }));
}
