import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import * as Layout from '#/components/Layout';
var Storybook = lazy(function () { return import('./Storybook'); });
export function StorybookScreen() {
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: "Storybook" }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { keyboardShouldPersistTaps: "handled", children: _jsx(Suspense, { fallback: null, children: _jsx(Storybook, {}) }) })] }));
}
