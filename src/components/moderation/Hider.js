import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useModerationCauseDescription, } from '#/lib/moderation/useModerationCauseDescription';
import { ModerationDetailsDialog, useModerationDetailsDialogControl, } from '#/components/moderation/ModerationDetailsDialog';
var Context = React.createContext({});
Context.displayName = 'HiderContext';
export var useHider = function () { return React.useContext(Context); };
export function Outer(_a) {
    var modui = _a.modui, isContentVisibleInitialState = _a.isContentVisibleInitialState, allowOverride = _a.allowOverride, children = _a.children;
    var control = useModerationDetailsDialogControl();
    var blur = modui === null || modui === void 0 ? void 0 : modui.blurs[0];
    var _b = React.useState(isContentVisibleInitialState || !blur), isContentVisible = _b[0], setIsContentVisible = _b[1];
    var info = useModerationCauseDescription(blur);
    var meta = {
        isNoPwi: Boolean(modui === null || modui === void 0 ? void 0 : modui.blurs.find(function (cause) {
            return cause.type === 'label' &&
                cause.labelDef.identifier === '!no-unauthenticated';
        })),
        allowOverride: allowOverride !== null && allowOverride !== void 0 ? allowOverride : !(modui === null || modui === void 0 ? void 0 : modui.noOverride),
    };
    var showInfoDialog = function () {
        control.open();
    };
    var onSetContentVisible = function (show) {
        if (!meta.allowOverride)
            return;
        setIsContentVisible(show);
    };
    var ctx = {
        isContentVisible: isContentVisible,
        setIsContentVisible: onSetContentVisible,
        showInfoDialog: showInfoDialog,
        info: info,
        meta: meta,
    };
    return (_jsxs(Context.Provider, { value: ctx, children: [children, _jsx(ModerationDetailsDialog, { control: control, modcause: blur })] }));
}
export function Content(_a) {
    var children = _a.children;
    var ctx = useHider();
    return ctx.isContentVisible ? children : null;
}
export function Mask(_a) {
    var children = _a.children;
    var ctx = useHider();
    return ctx.isContentVisible ? null : children;
}
