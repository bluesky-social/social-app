import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Header } from '#/components/Layout';
/**
 * Legacy ViewHeader component. Use Layout.Header going forward.
 *
 * @deprecated use `Layout.Header` from `#/components/Layout.tsx`
 */
export function ViewHeader(_a) {
    var _b;
    var title = _a.title, renderButton = _a.renderButton;
    return (_jsxs(Header.Outer, { children: [_jsx(Header.BackButton, {}), _jsx(Header.Content, { children: _jsx(Header.TitleText, { children: title }) }), _jsx(Header.Slot, { children: (_b = renderButton === null || renderButton === void 0 ? void 0 : renderButton()) !== null && _b !== void 0 ? _b : null })] }));
}
