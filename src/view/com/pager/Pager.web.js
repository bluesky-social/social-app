import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, useCallback, useImperativeHandle, useRef, useState, } from 'react';
import { View } from 'react-native';
import { flushSync } from 'react-dom';
import { s } from '#/lib/styles';
import { atoms as a } from '#/alf';
export function Pager(_a) {
    var ref = _a.ref, children = _a.children, _b = _a.initialPage, initialPage = _b === void 0 ? 0 : _b, renderTabBar = _a.renderTabBar, onPageSelected = _a.onPageSelected;
    var _c = useState(initialPage), selectedPage = _c[0], setSelectedPage = _c[1];
    var scrollYs = useRef([]);
    var anchorRef = useRef(null);
    useImperativeHandle(ref, function () { return ({
        setPage: function (index) {
            onTabBarSelect(index);
        },
    }); });
    var onTabBarSelect = useCallback(function (index) {
        var scrollY = window.scrollY;
        // We want to determine if the tabbar is already "sticking" at the top (in which
        // case we should preserve and restore scroll), or if it is somewhere below in the
        // viewport (in which case a scroll jump would be jarring). We determine this by
        // measuring where the "anchor" element is (which we place just above the tabbar).
        var anchorTop = anchorRef.current
            ? anchorRef.current.getBoundingClientRect().top
            : -scrollY; // If there's no anchor, treat the top of the page as one.
        var isSticking = anchorTop <= 5; // This would be 0 if browser scrollTo() was reliable.
        if (isSticking) {
            scrollYs.current[selectedPage] = window.scrollY;
        }
        else {
            scrollYs.current[selectedPage] = null;
        }
        flushSync(function () {
            setSelectedPage(index);
            onPageSelected === null || onPageSelected === void 0 ? void 0 : onPageSelected(index);
        });
        if (isSticking) {
            var restoredScrollY = scrollYs.current[index];
            if (restoredScrollY != null) {
                window.scrollTo(0, restoredScrollY);
            }
            else {
                window.scrollTo(0, scrollY + anchorTop);
            }
        }
    }, [selectedPage, setSelectedPage, onPageSelected]);
    return (_jsxs(View, { style: s.hContentRegion, children: [renderTabBar({
                selectedPage: selectedPage,
                tabBarAnchor: _jsx(View, { ref: anchorRef }),
                onSelect: function (e) { return onTabBarSelect(e); },
            }), Children.map(children, function (child, i) { return (_jsx(View, { style: selectedPage === i ? a.flex_1 : a.hidden, children: child }, "page-".concat(i))); })] }));
}
