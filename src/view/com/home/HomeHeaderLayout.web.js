var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { HITSLOP_10 } from '#/lib/constants';
import { useKawaiiMode } from '#/state/preferences/kawaii';
import { useSession } from '#/state/session';
import { useShellLayout } from '#/state/shell/shell-layout';
import { HomeHeaderLayoutMobile } from '#/view/com/home/HomeHeaderLayoutMobile';
import { Logo } from '#/view/icons/Logo';
import { atoms as a, useBreakpoints, useGutters, useTheme } from '#/alf';
import { ButtonIcon } from '#/components/Button';
import { Hashtag_Stroke2_Corner0_Rounded as FeedsIcon } from '#/components/icons/Hashtag';
import * as Layout from '#/components/Layout';
import { Link } from '#/components/Link';
export function HomeHeaderLayout(props) {
    var gtMobile = useBreakpoints().gtMobile;
    if (!gtMobile) {
        return _jsx(HomeHeaderLayoutMobile, __assign({}, props));
    }
    else {
        return _jsx(HomeHeaderLayoutDesktopAndTablet, __assign({}, props));
    }
}
function HomeHeaderLayoutDesktopAndTablet(_a) {
    var children = _a.children, tabBarAnchor = _a.tabBarAnchor;
    var t = useTheme();
    var headerHeight = useShellLayout().headerHeight;
    var hasSession = useSession().hasSession;
    var _ = useLingui()._;
    var kawaii = useKawaiiMode();
    var gutters = useGutters([0, 'base']);
    return (_jsxs(_Fragment, { children: [hasSession && (_jsx(Layout.Center, { children: _jsxs(View, { style: [a.flex_row, a.align_center, gutters, a.pt_md, t.atoms.bg], children: [_jsx(View, { style: { width: 34 } }), _jsx(View, { style: [a.flex_1, a.align_center, a.justify_center], children: _jsx(Logo, { width: kawaii ? 60 : 28 }) }), _jsx(Link, { to: "/feeds", hitSlop: HITSLOP_10, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View your feeds and explore more"], ["View your feeds and explore more"])))), size: "small", variant: "ghost", color: "secondary", shape: "square", style: [a.justify_center], children: _jsx(ButtonIcon, { icon: FeedsIcon, size: "lg" }) })] }) })), tabBarAnchor, _jsx(Layout.Center, { style: [a.sticky, a.z_10, a.align_center, t.atoms.bg, { top: 0 }], onLayout: function (e) {
                    headerHeight.set(e.nativeEvent.layout.height);
                }, children: children })] }));
}
var templateObject_1;
