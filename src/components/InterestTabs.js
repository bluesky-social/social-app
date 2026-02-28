var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { DraggableScrollView } from '#/view/com/pager/DraggableScrollView';
import { atoms as a, tokens, useTheme, web } from '#/alf';
import { transparentifyColor } from '#/alf/util/colorGeneration';
import { Button, ButtonIcon } from '#/components/Button';
import { ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft, ArrowRight_Stroke2_Corner0_Rounded as ArrowRight, } from '#/components/icons/Arrow';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
/**
 * Tab component that automatically scrolls the selected tab into view - used for interests
 * in the Find Follows dialog, Explore screen, etc.
 */
export function InterestTabs(_c) {
    var onSelectTab = _c.onSelectTab, interests = _c.interests, selectedInterest = _c.selectedInterest, disabled = _c.disabled, interestsDisplayNames = _c.interestsDisplayNames, _d = _c.TabComponent, TabComponent = _d === void 0 ? Tab : _d, contentContainerStyle = _c.contentContainerStyle, _e = _c.gutterWidth, gutterWidth = _e === void 0 ? tokens.space.lg : _e;
    var t = useTheme();
    var _ = useLingui()._;
    var listRef = useRef(null);
    var _f = useState(0), totalWidth = _f[0], setTotalWidth = _f[1];
    var _g = useState(0), scrollX = _g[0], setScrollX = _g[1];
    var _h = useState(0), contentWidth = _h[0], setContentWidth = _h[1];
    var pendingTabOffsets = useRef([]);
    var _j = useState([]), tabOffsets = _j[0], setTabOffsets = _j[1];
    var onInitialLayout = useNonReactiveCallback(function () {
        var index = interests.indexOf(selectedInterest);
        scrollIntoViewIfNeeded(index);
    });
    useEffect(function () {
        if (tabOffsets) {
            onInitialLayout();
        }
    }, [tabOffsets, onInitialLayout]);
    function scrollIntoViewIfNeeded(index) {
        var _c;
        var btnLayout = tabOffsets[index];
        if (!btnLayout)
            return;
        (_c = listRef.current) === null || _c === void 0 ? void 0 : _c.scrollTo({
            // centered
            x: btnLayout.x - (totalWidth / 2 - btnLayout.width / 2),
            animated: true,
        });
    }
    function handleSelectTab(index) {
        var tab = interests[index];
        onSelectTab(tab);
        scrollIntoViewIfNeeded(index);
    }
    function handleTabLayout(index, x, width) {
        if (!tabOffsets.length) {
            pendingTabOffsets.current[index] = { x: x, width: width };
            // not only do we check if the length is equal to the number of interests,
            // but we also need to ensure that the array isn't sparse. `.filter()`
            // removes any empty slots from the array
            if (pendingTabOffsets.current.filter(function (o) { return !!o; }).length === interests.length) {
                setTabOffsets(pendingTabOffsets.current);
            }
        }
    }
    var canScrollLeft = scrollX > 0;
    var canScrollRight = Math.ceil(scrollX) < contentWidth - totalWidth;
    var cleanupRef = useRef(null);
    function scrollLeft() {
        if (isContinuouslyScrollingRef.current) {
            return;
        }
        if (listRef.current && canScrollLeft) {
            var newScrollX = Math.max(0, scrollX - 200);
            listRef.current.scrollTo({ x: newScrollX, animated: true });
        }
    }
    function scrollRight() {
        if (isContinuouslyScrollingRef.current) {
            return;
        }
        if (listRef.current && canScrollRight) {
            var maxScroll = contentWidth - totalWidth;
            var newScrollX = Math.min(maxScroll, scrollX + 200);
            listRef.current.scrollTo({ x: newScrollX, animated: true });
        }
    }
    var isContinuouslyScrollingRef = useRef(false);
    function startContinuousScroll(direction) {
        // Clear any existing continuous scroll
        if (cleanupRef.current) {
            cleanupRef.current();
        }
        var holdTimeout = null;
        var animationFrame = null;
        var isActive = true;
        isContinuouslyScrollingRef.current = false;
        var cleanup = function () {
            isActive = false;
            if (holdTimeout)
                clearTimeout(holdTimeout);
            if (animationFrame)
                cancelAnimationFrame(animationFrame);
            cleanupRef.current = null;
            // Reset flag after a delay to prevent onPress from firing
            setTimeout(function () {
                isContinuouslyScrollingRef.current = false;
            }, 100);
        };
        cleanupRef.current = cleanup;
        // Start continuous scrolling after hold delay
        holdTimeout = setTimeout(function () {
            if (!isActive)
                return;
            isContinuouslyScrollingRef.current = true;
            var currentScrollPosition = scrollX;
            var scroll = function () {
                if (!isActive || !listRef.current)
                    return;
                var scrollAmount = 3;
                var maxScroll = contentWidth - totalWidth;
                var newScrollX;
                var canContinue = false;
                if (direction === 'left' && currentScrollPosition > 0) {
                    newScrollX = Math.max(0, currentScrollPosition - scrollAmount);
                    canContinue = newScrollX > 0;
                }
                else if (direction === 'right' && currentScrollPosition < maxScroll) {
                    newScrollX = Math.min(maxScroll, currentScrollPosition + scrollAmount);
                    canContinue = newScrollX < maxScroll;
                }
                else {
                    return;
                }
                currentScrollPosition = newScrollX;
                listRef.current.scrollTo({ x: newScrollX, animated: false });
                if (canContinue && isActive) {
                    animationFrame = requestAnimationFrame(scroll);
                }
            };
            scroll();
        }, 500);
    }
    function stopContinuousScroll() {
        if (cleanupRef.current) {
            cleanupRef.current();
        }
    }
    useEffect(function () {
        return function () {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);
    return (_jsxs(View, { style: [a.relative, a.flex_row], children: [_jsx(DraggableScrollView, { ref: listRef, contentContainerStyle: [
                    a.gap_sm,
                    { paddingHorizontal: gutterWidth },
                    contentContainerStyle,
                ], showsHorizontalScrollIndicator: false, decelerationRate: "fast", snapToOffsets: tabOffsets.filter(function (o) { return !!o; }).length === interests.length
                    ? tabOffsets.map(function (o) { return o.x - tokens.space.xl; })
                    : undefined, onLayout: function (evt) { return setTotalWidth(evt.nativeEvent.layout.width); }, onContentSizeChange: function (width) { return setContentWidth(width); }, onScroll: function (evt) {
                    var newScrollX = evt.nativeEvent.contentOffset.x;
                    setScrollX(newScrollX);
                }, scrollEventThrottle: 16, children: interests.map(function (interest, i) {
                    var active = interest === selectedInterest && !disabled;
                    return (_jsx(TabComponent, { onSelectTab: handleSelectTab, active: active, index: i, interest: interest, interestsDisplayName: interestsDisplayNames[interest], onLayout: handleTabLayout }, interest));
                }) }), IS_WEB && canScrollLeft && (_jsx(View, { style: [
                    a.absolute,
                    a.top_0,
                    a.left_0,
                    a.bottom_0,
                    a.justify_center,
                    { paddingLeft: gutterWidth },
                    a.pr_md,
                    a.z_10,
                    web({
                        background: "linear-gradient(to right,  ".concat(t.atoms.bg.backgroundColor, " 0%, ").concat(t.atoms.bg.backgroundColor, " 70%, ").concat(transparentifyColor(t.atoms.bg.backgroundColor, 0), " 100%)"),
                    }),
                ], children: _jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Scroll left"], ["Scroll left"])))), onPress: scrollLeft, onPressIn: function () { return startContinuousScroll('left'); }, onPressOut: stopContinuousScroll, color: "secondary", size: "small", style: [
                        a.border,
                        t.atoms.border_contrast_low,
                        t.atoms.bg,
                        a.h_full,
                        a.aspect_square,
                        a.rounded_full,
                    ], children: _jsx(ButtonIcon, { icon: ArrowLeft }) }) })), IS_WEB && canScrollRight && (_jsx(View, { style: [
                    a.absolute,
                    a.top_0,
                    a.right_0,
                    a.bottom_0,
                    a.justify_center,
                    { paddingRight: gutterWidth },
                    a.pl_md,
                    a.z_10,
                    web({
                        background: "linear-gradient(to left, ".concat(t.atoms.bg.backgroundColor, " 0%, ").concat(t.atoms.bg.backgroundColor, " 70%, ").concat(transparentifyColor(t.atoms.bg.backgroundColor, 0), " 100%)"),
                    }),
                ], children: _jsx(Button, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Scroll right"], ["Scroll right"])))), onPress: scrollRight, onPressIn: function () { return startContinuousScroll('right'); }, onPressOut: stopContinuousScroll, color: "secondary", size: "small", style: [
                        a.border,
                        t.atoms.border_contrast_low,
                        t.atoms.bg,
                        a.h_full,
                        a.aspect_square,
                        a.rounded_full,
                    ], children: _jsx(ButtonIcon, { icon: ArrowRight }) }) }))] }));
}
function Tab(_c) {
    var onSelectTab = _c.onSelectTab, interest = _c.interest, active = _c.active, index = _c.index, interestsDisplayName = _c.interestsDisplayName, onLayout = _c.onLayout;
    var t = useTheme();
    var _ = useLingui()._;
    var label = active
        ? _(msg({
            message: "\"".concat(interestsDisplayName, "\" category (active)"),
            comment: 'Accessibility label for a category (e.g. Art, Video Games, Sports, etc.) that shows suggested accounts for the user to follow. The tab is currently selected.',
        }))
        : _(msg({
            message: "Select \"".concat(interestsDisplayName, "\" category"),
            comment: 'Accessibility label for a category (e.g. Art, Video Games, Sports, etc.) that shows suggested accounts for the user to follow. The tab is not currently active and can be selected.',
        }));
    return (_jsx(View, { onLayout: function (e) {
            return onLayout(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width);
        }, children: _jsx(Button, { label: label, onPress: function () { return onSelectTab(index); }, 
            // disable focus ring, we handle it
            style: web({ outline: 'none' }), children: function (_c) {
                var hovered = _c.hovered, pressed = _c.pressed, focused = _c.focused;
                return (_jsx(View, { style: [
                        a.rounded_full,
                        a.px_lg,
                        a.py_sm,
                        a.border,
                        active || hovered || pressed
                            ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_medium]
                            : focused
                                ? {
                                    borderColor: t.palette.primary_300,
                                    backgroundColor: t.palette.primary_25,
                                }
                                : [t.atoms.bg, t.atoms.border_contrast_low],
                    ], children: _jsx(Text, { style: [
                            a.font_medium,
                            active || hovered || pressed
                                ? t.atoms.text
                                : t.atoms.text_contrast_medium,
                        ], children: interestsDisplayName }) }));
            } }) }, interest));
}
export function boostInterests(boosts) {
    return function (_a, _b) {
        var _c, _d;
        var indexA = (_c = boosts === null || boosts === void 0 ? void 0 : boosts.indexOf(_a)) !== null && _c !== void 0 ? _c : -1;
        var indexB = (_d = boosts === null || boosts === void 0 ? void 0 : boosts.indexOf(_b)) !== null && _d !== void 0 ? _d : -1;
        var rankA = indexA === -1 ? Infinity : indexA;
        var rankB = indexB === -1 ? Infinity : indexB;
        return rankA - rankB;
    };
}
var templateObject_1, templateObject_2;
