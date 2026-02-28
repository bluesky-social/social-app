import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View, } from 'react-native';
import Animated, { interpolate, runOnJS, runOnUI, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { PressableWithHover } from '#/view/com/util/PressableWithHover';
import { BlockDrawerGesture } from '#/view/shell/BlockDrawerGesture';
import { atoms as a, useTheme } from '#/alf';
import { Text } from '#/components/Typography';
var ITEM_PADDING = 10;
var CONTENT_PADDING = 6;
// How much of the previous/next item we're requiring
// when deciding whether to scroll into view on tap.
var OFFSCREEN_ITEM_WIDTH = 20;
export function TabBar(_a) {
    var testID = _a.testID, selectedPage = _a.selectedPage, items = _a.items, onSelect = _a.onSelect, onPressSelected = _a.onPressSelected, dragProgress = _a.dragProgress, dragState = _a.dragState, transparent = _a.transparent;
    var t = useTheme();
    var scrollElRef = useAnimatedRef();
    var syncScrollState = useSharedValue('synced');
    var didInitialScroll = useSharedValue(false);
    var contentSize = useSharedValue(0);
    var containerSize = useSharedValue(0);
    var scrollX = useSharedValue(0);
    var layouts = useSharedValue([]);
    var textLayouts = useSharedValue([]);
    var itemsLength = items.length;
    var scrollToOffsetJS = useCallback(function (x) {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({
            x: x,
            y: 0,
            animated: true,
        });
    }, [scrollElRef]);
    var indexToOffset = useCallback(function (index) {
        'worklet';
        var layout = layouts.get()[index];
        var availableSize = containerSize.get() - 2 * CONTENT_PADDING;
        if (!layout) {
            // Should not happen, but fall back to equal sizes.
            var offsetPerPage = contentSize.get() - availableSize;
            return (index / (itemsLength - 1)) * offsetPerPage;
        }
        var freeSpace = availableSize - layout.width;
        var accumulatingOffset = interpolate(index, 
        // Gradually shift every next item to the left so that the first item
        // is positioned like "left: 0" but the last item is like "right: 0".
        [0, itemsLength - 1], [0, freeSpace], 'clamp');
        return layout.x - accumulatingOffset;
    }, [itemsLength, contentSize, containerSize, layouts]);
    var progressToOffset = useCallback(function (progress) {
        'worklet';
        return interpolate(progress, [Math.floor(progress), Math.ceil(progress)], [
            indexToOffset(Math.floor(progress)),
            indexToOffset(Math.ceil(progress)),
        ], 'clamp');
    }, [indexToOffset]);
    // When we know the entire layout for the first time, scroll selection into view.
    useAnimatedReaction(function () { return layouts.get().length; }, function (nextLayoutsLength, prevLayoutsLength) {
        if (nextLayoutsLength !== prevLayoutsLength) {
            if (nextLayoutsLength === itemsLength &&
                didInitialScroll.get() === false) {
                didInitialScroll.set(true);
                var progress = dragProgress.get();
                var offset = progressToOffset(progress);
                // It's unclear why we need to go back to JS here. It seems iOS-specific.
                runOnJS(scrollToOffsetJS)(offset);
            }
        }
    });
    // When you swipe the pager, the tabbar should scroll automatically
    // as you're dragging the page and then even during deceleration.
    useAnimatedReaction(function () { return dragProgress.get(); }, function (nextProgress, prevProgress) {
        if (nextProgress !== prevProgress &&
            dragState.value !== 'idle' &&
            // This is only OK to do when we're 100% sure we're synced.
            // Otherwise, there would be a jump at the beginning of the swipe.
            syncScrollState.get() === 'synced') {
            var offset = progressToOffset(nextProgress);
            scrollTo(scrollElRef, offset, 0, false);
        }
    });
    // If the syncing is currently off but you've just finished swiping,
    // it's an opportunity to resync. It won't feel disruptive because
    // you're not directly interacting with the tabbar at the moment.
    useAnimatedReaction(function () { return dragState.value; }, function (nextDragState, prevDragState) {
        if (nextDragState !== prevDragState &&
            nextDragState === 'idle' &&
            (syncScrollState.get() === 'unsynced' ||
                syncScrollState.get() === 'needs-sync')) {
            var progress = dragProgress.get();
            var offset = progressToOffset(progress);
            scrollTo(scrollElRef, offset, 0, true);
            syncScrollState.set('synced');
        }
    });
    // When you press on the item, we'll scroll into view -- unless you previously
    // have scrolled the tabbar manually, in which case it'll re-sync on next press.
    var onPressUIThread = useCallback(function (index) {
        'worklet';
        var itemLayout = layouts.get()[index];
        if (!itemLayout) {
            // Should not happen.
            return;
        }
        var leftEdge = itemLayout.x - OFFSCREEN_ITEM_WIDTH;
        var rightEdge = itemLayout.x + itemLayout.width + OFFSCREEN_ITEM_WIDTH;
        var scrollLeft = scrollX.get();
        var scrollRight = scrollLeft + containerSize.get();
        var scrollIntoView = leftEdge < scrollLeft || rightEdge > scrollRight;
        if (syncScrollState.get() === 'synced' ||
            syncScrollState.get() === 'needs-sync' ||
            scrollIntoView) {
            var offset = progressToOffset(index);
            scrollTo(scrollElRef, offset, 0, true);
            syncScrollState.set('synced');
        }
        else {
            // The item is already in view so it's disruptive to
            // scroll right now. Do it on the next opportunity.
            syncScrollState.set('needs-sync');
        }
    }, [
        syncScrollState,
        scrollElRef,
        scrollX,
        progressToOffset,
        containerSize,
        layouts,
    ]);
    var onItemLayout = useCallback(function (i, layout) {
        'worklet';
        layouts.modify(function (ls) {
            ls[i] = layout;
            return ls;
        });
    }, [layouts]);
    var onTextLayout = useCallback(function (i, layout) {
        'worklet';
        textLayouts.modify(function (ls) {
            ls[i] = layout;
            return ls;
        });
    }, [textLayouts]);
    var indicatorStyle = useAnimatedStyle(function () {
        if (!_WORKLET) {
            return { opacity: 0 };
        }
        var layoutsValue = layouts.get();
        var textLayoutsValue = textLayouts.get();
        if (layoutsValue.length !== itemsLength ||
            textLayoutsValue.length !== itemsLength) {
            return {
                opacity: 0,
            };
        }
        function getScaleX(index) {
            var textWidth = textLayoutsValue[index].width;
            var itemWidth = layoutsValue[index].width;
            var minIndicatorWidth = 45;
            var maxIndicatorWidth = itemWidth - 2 * CONTENT_PADDING;
            var indicatorWidth = Math.min(Math.max(minIndicatorWidth, textWidth), maxIndicatorWidth);
            return indicatorWidth / contentSize.get();
        }
        if (textLayoutsValue.length === 1) {
            return {
                opacity: 1,
                transform: [
                    {
                        scaleX: getScaleX(0),
                    },
                ],
            };
        }
        return {
            opacity: 1,
            transform: [
                {
                    translateX: interpolate(dragProgress.get(), layoutsValue.map(function (l, i) {
                        'worklet';
                        return i;
                    }), layoutsValue.map(function (l) {
                        'worklet';
                        return l.x + l.width / 2 - contentSize.get() / 2;
                    })),
                },
                {
                    scaleX: interpolate(dragProgress.get(), textLayoutsValue.map(function (l, i) {
                        'worklet';
                        return i;
                    }), textLayoutsValue.map(function (l, i) {
                        'worklet';
                        return getScaleX(i);
                    })),
                },
            ],
        };
    });
    var onPressItem = useCallback(function (index) {
        runOnUI(onPressUIThread)(index);
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(index);
        if (index === selectedPage) {
            onPressSelected === null || onPressSelected === void 0 ? void 0 : onPressSelected(index);
        }
    }, [onSelect, selectedPage, onPressSelected, onPressUIThread]);
    return (_jsxs(View, { testID: testID, style: [!transparent && t.atoms.bg, a.flex_row], accessibilityRole: "tablist", children: [_jsx(BlockDrawerGesture, { children: _jsx(ScrollView, { testID: "".concat(testID, "-selector"), horizontal: true, showsHorizontalScrollIndicator: false, ref: scrollElRef, contentContainerStyle: styles.contentContainer, onLayout: function (e) {
                        containerSize.set(e.nativeEvent.layout.width);
                    }, onScrollBeginDrag: function () {
                        // Remember that you've manually messed with the tabbar scroll.
                        // This will disable auto-adjustment until after next pager swipe or item tap.
                        syncScrollState.set('unsynced');
                    }, onScroll: function (e) {
                        scrollX.value = Math.round(e.nativeEvent.contentOffset.x);
                    }, children: _jsxs(Animated.View, { onLayout: function (e) {
                            contentSize.set(e.nativeEvent.layout.width);
                        }, style: { flexDirection: 'row', flexGrow: 1 }, children: [items.map(function (item, i) {
                                return (_jsx(TabBarItem, { index: i, testID: testID, dragProgress: dragProgress, item: item, onPressItem: onPressItem, onItemLayout: onItemLayout, onTextLayout: onTextLayout }, i));
                            }), _jsx(Animated.View, { style: [
                                    indicatorStyle,
                                    {
                                        position: 'absolute',
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        borderBottomWidth: 2,
                                        borderColor: t.palette.primary_500,
                                    },
                                ] })] }) }) }), _jsx(View, { style: [t.atoms.border_contrast_low, styles.outerBottomBorder] })] }));
}
function TabBarItem(_a) {
    var index = _a.index, testID = _a.testID, dragProgress = _a.dragProgress, item = _a.item, onPressItem = _a.onPressItem, onItemLayout = _a.onItemLayout, onTextLayout = _a.onTextLayout;
    var t = useTheme();
    var style = useAnimatedStyle(function () {
        if (!_WORKLET) {
            return { opacity: 0.7 };
        }
        return {
            opacity: interpolate(dragProgress.get(), [index - 1, index, index + 1], [0.7, 1, 0.7], 'clamp'),
        };
    });
    var handleLayout = useCallback(function (e) {
        runOnUI(onItemLayout)(index, e.nativeEvent.layout);
    }, [index, onItemLayout]);
    var handleTextLayout = useCallback(function (e) {
        runOnUI(onTextLayout)(index, e.nativeEvent.layout);
    }, [index, onTextLayout]);
    return (_jsx(View, { onLayout: handleLayout, style: { flexGrow: 1 }, children: _jsx(PressableWithHover, { testID: "".concat(testID, "-selector-").concat(index), style: styles.item, hoverStyle: t.atoms.bg_contrast_25, onPress: function () { return onPressItem(index); }, accessibilityRole: "tab", children: _jsx(Animated.View, { style: [style, styles.itemInner], children: _jsx(Text, { emoji: true, testID: testID ? "".concat(testID, "-").concat(item) : undefined, style: [styles.itemText, t.atoms.text, a.text_md, a.font_semi_bold], onLayout: handleTextLayout, children: item }) }) }) }));
}
var styles = StyleSheet.create({
    contentContainer: {
        flexGrow: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: CONTENT_PADDING,
    },
    item: {
        flexGrow: 1,
        paddingTop: 10,
        paddingHorizontal: ITEM_PADDING,
        justifyContent: 'center',
    },
    itemInner: {
        alignItems: 'center',
        flexGrow: 1,
        paddingBottom: 10,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    itemText: {
        lineHeight: 20,
        textAlign: 'center',
    },
    outerBottomBorder: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '100%',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
});
