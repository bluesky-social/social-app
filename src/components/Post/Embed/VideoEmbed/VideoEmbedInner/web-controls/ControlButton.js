import { jsx as _jsx } from "react/jsx-runtime";
import { PressableWithHover } from '#/view/com/util/PressableWithHover';
import { atoms as a, useTheme, web } from '#/alf';
export function ControlButton(_a) {
    var active = _a.active, activeLabel = _a.activeLabel, inactiveLabel = _a.inactiveLabel, ActiveIcon = _a.activeIcon, InactiveIcon = _a.inactiveIcon, onPress = _a.onPress;
    var t = useTheme();
    return (_jsx(PressableWithHover, { accessibilityRole: "button", accessibilityLabel: active ? activeLabel : inactiveLabel, accessibilityHint: "", onPress: onPress, style: [
            a.p_xs,
            a.rounded_full,
            web({ transition: 'background-color 0.1s' }),
        ], hoverStyle: { backgroundColor: 'rgba(255, 255, 255, 0.2)' }, children: active ? (_jsx(ActiveIcon, { fill: t.palette.white, width: 20, "aria-hidden": true })) : (_jsx(InactiveIcon, { fill: t.palette.white, width: 20, "aria-hidden": true })) }));
}
