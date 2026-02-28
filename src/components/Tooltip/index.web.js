import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, createContext, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { utils } from '@bsky.app/alf';
import { Popover } from 'radix-ui';
import { atoms as a, flatten, select, useTheme } from '#/alf';
import { ARROW_SIZE, BUBBLE_MAX_WIDTH, MIN_EDGE_SPACE, } from '#/components/Tooltip/const';
import { Text } from '#/components/Typography';
// Portal Provider on native, but we actually don't need to do anything here
export function Provider(_a) {
    var children = _a.children;
    return _jsx(_Fragment, { children: children });
}
Provider.displayName = 'TooltipProvider';
var TooltipContext = createContext({
    position: 'bottom',
});
TooltipContext.displayName = 'TooltipContext';
export function Outer(_a) {
    var children = _a.children, _b = _a.position, position = _b === void 0 ? 'bottom' : _b, visible = _a.visible, onVisibleChange = _a.onVisibleChange;
    var ctx = useMemo(function () { return ({ position: position }); }, [position]);
    return (_jsx(Popover.Root, { open: visible, onOpenChange: onVisibleChange, children: _jsx(TooltipContext.Provider, { value: ctx, children: children }) }));
}
export function Target(_a) {
    var children = _a.children;
    return (_jsx(Popover.Trigger, { asChild: true, children: _jsx(View, { collapsable: false, children: children }) }));
}
export function Content(_a) {
    var children = _a.children, label = _a.label;
    var t = useTheme();
    var position = useContext(TooltipContext).position;
    return (_jsx(Popover.Portal, { children: _jsxs(Popover.Content, { className: "radix-popover-content", "aria-label": label, side: position, sideOffset: 4, collisionPadding: MIN_EDGE_SPACE, onInteractOutside: function (evt) {
                if (evt.type === 'dismissableLayer.focusOutside') {
                    evt.preventDefault();
                }
            }, style: flatten([
                a.rounded_sm,
                select(t.name, {
                    light: t.atoms.bg,
                    dark: t.atoms.bg_contrast_100,
                    dim: t.atoms.bg_contrast_100,
                }),
                {
                    minWidth: 'max-content',
                    boxShadow: select(t.name, {
                        light: "0 0 24px ".concat(utils.alpha(t.palette.black, 0.2)),
                        dark: "0 0 24px ".concat(utils.alpha(t.palette.black, 0.2)),
                        dim: "0 0 24px ".concat(utils.alpha(t.palette.black, 0.2)),
                    }),
                },
            ]), children: [_jsx(Popover.Arrow, { width: ARROW_SIZE, height: ARROW_SIZE / 2, fill: select(t.name, {
                        light: t.atoms.bg.backgroundColor,
                        dark: t.atoms.bg_contrast_100.backgroundColor,
                        dim: t.atoms.bg_contrast_100.backgroundColor,
                    }) }), _jsx(View, { style: [a.px_md, a.py_sm, { maxWidth: BUBBLE_MAX_WIDTH }], children: children })] }) }));
}
export function TextBubble(_a) {
    var children = _a.children;
    var c = Children.toArray(children);
    return (_jsx(Content, { label: c.join(' '), children: _jsx(View, { style: [a.gap_xs], children: c.map(function (child, i) { return (_jsx(Text, { style: [a.text_sm, a.leading_snug], children: child }, i)); }) }) }));
}
