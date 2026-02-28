import { jsx as _jsx } from "react/jsx-runtime";
import { FocusScope as RadixFocusScope } from 'radix-ui/internal';
/*
 * The web version of the FocusScope component is a proper implementation, we
 * use this in Dialogs and such already. It's here as a convenient counterpart
 * to the hacky native solution.
 */
export function FocusScope(_a) {
    var children = _a.children;
    return (_jsx(RadixFocusScope.FocusScope, { loop: true, asChild: true, trapped: true, children: children }));
}
