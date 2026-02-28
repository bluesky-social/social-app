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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { isValidElement, memo, startTransition, useRef, } from 'react';
import { StyleSheet, View, } from 'react-native';
import { batchedUpdates } from '#/lib/batchedUpdates';
import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useScrollHandlers } from '#/lib/ScrollContext';
import { addStyle } from '#/lib/styles';
import * as Layout from '#/components/Layout';
var ON_ITEM_SEEN_WAIT_DURATION = 0.5e3; // when we consider post to  be "seen"
var ON_ITEM_SEEN_INTERSECTION_OPTS = {
    rootMargin: '-200px 0px -200px 0px',
}; // post must be 200px visible to be "seen"
function ListImpl(_a, ref) {
    var ListHeaderComponent = _a.ListHeaderComponent, ListFooterComponent = _a.ListFooterComponent, ListEmptyComponent = _a.ListEmptyComponent, disableFullWindowScroll = _a.disableFullWindowScroll, contentContainerStyle = _a.contentContainerStyle, data = _a.data, desktopFixedHeight = _a.desktopFixedHeight, headerOffset = _a.headerOffset, keyExtractor = _a.keyExtractor, _unsupportedRefreshing = _a.refreshing, onStartReached = _a.onStartReached, _b = _a.onStartReachedThreshold, onStartReachedThreshold = _b === void 0 ? 2 : _b, onEndReached = _a.onEndReached, _c = _a.onEndReachedThreshold, onEndReachedThreshold = _c === void 0 ? 2 : _c, _unsupportedOnRefresh = _a.onRefresh, onScrolledDownChange = _a.onScrolledDownChange, onContentSizeChange = _a.onContentSizeChange, onItemSeen = _a.onItemSeen, renderItem = _a.renderItem, extraData = _a.extraData, style = _a.style, props = __rest(_a, ["ListHeaderComponent", "ListFooterComponent", "ListEmptyComponent", "disableFullWindowScroll", "contentContainerStyle", "data", "desktopFixedHeight", "headerOffset", "keyExtractor", "refreshing", "onStartReached", "onStartReachedThreshold", "onEndReached", "onEndReachedThreshold", "onRefresh", "onScrolledDownChange", "onContentSizeChange", "onItemSeen", "renderItem", "extraData", "style"]);
    var contextScrollHandlers = useScrollHandlers();
    var isEmpty = !data || data.length === 0;
    var headerComponent = null;
    if (ListHeaderComponent != null) {
        if (isValidElement(ListHeaderComponent)) {
            headerComponent = ListHeaderComponent;
        }
        else {
            // @ts-ignore Nah it's fine.
            headerComponent = _jsx(ListHeaderComponent, {});
        }
    }
    var footerComponent = null;
    if (ListFooterComponent != null) {
        if (isValidElement(ListFooterComponent)) {
            footerComponent = ListFooterComponent;
        }
        else {
            // @ts-ignore Nah it's fine.
            footerComponent = _jsx(ListFooterComponent, {});
        }
    }
    var emptyComponent = null;
    if (ListEmptyComponent != null) {
        if (isValidElement(ListEmptyComponent)) {
            emptyComponent = ListEmptyComponent;
        }
        else {
            // @ts-ignore Nah it's fine.
            emptyComponent = _jsx(ListEmptyComponent, {});
        }
    }
    if (headerOffset != null) {
        style = addStyle(style, {
            paddingTop: headerOffset,
        });
    }
    var getScrollableNode = React.useCallback(function () {
        if (disableFullWindowScroll) {
            var element_1 = nativeRef.current;
            if (!element_1)
                return;
            return {
                get scrollWidth() {
                    return element_1.scrollWidth;
                },
                get scrollHeight() {
                    return element_1.scrollHeight;
                },
                get clientWidth() {
                    return element_1.clientWidth;
                },
                get clientHeight() {
                    return element_1.clientHeight;
                },
                get scrollY() {
                    return element_1.scrollTop;
                },
                get scrollX() {
                    return element_1.scrollLeft;
                },
                scrollTo: function (options) {
                    element_1.scrollTo(options);
                },
                scrollBy: function (options) {
                    element_1.scrollBy(options);
                },
                addEventListener: function (event, handler) {
                    element_1.addEventListener(event, handler);
                },
                removeEventListener: function (event, handler) {
                    element_1.removeEventListener(event, handler);
                },
            };
        }
        else {
            return {
                get scrollWidth() {
                    return document.documentElement.scrollWidth;
                },
                get scrollHeight() {
                    return document.documentElement.scrollHeight;
                },
                get clientWidth() {
                    return window.innerWidth;
                },
                get clientHeight() {
                    return window.innerHeight;
                },
                get scrollY() {
                    return window.scrollY;
                },
                get scrollX() {
                    return window.scrollX;
                },
                scrollTo: function (options) {
                    window.scrollTo(options);
                },
                scrollBy: function (options) {
                    window.scrollBy(options);
                },
                addEventListener: function (event, handler) {
                    window.addEventListener(event, handler);
                },
                removeEventListener: function (event, handler) {
                    window.removeEventListener(event, handler);
                },
            };
        }
    }, [disableFullWindowScroll]);
    var nativeRef = React.useRef(null);
    React.useImperativeHandle(ref, function () {
        return ({
            scrollToTop: function () {
                var _a;
                (_a = getScrollableNode()) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: 0 });
            },
            scrollToOffset: function (_a) {
                var _b;
                var animated = _a.animated, offset = _a.offset;
                (_b = getScrollableNode()) === null || _b === void 0 ? void 0 : _b.scrollTo({
                    left: 0,
                    top: offset,
                    behavior: animated ? 'smooth' : 'instant',
                });
            },
            scrollToEnd: function (_a) {
                var _b = _a.animated, animated = _b === void 0 ? true : _b;
                var element = getScrollableNode();
                element === null || element === void 0 ? void 0 : element.scrollTo({
                    left: 0,
                    top: element.scrollHeight,
                    behavior: animated ? 'smooth' : 'instant',
                });
            },
        });
    }, // TODO: Better types.
    [getScrollableNode]);
    // --- onContentSizeChange, maintainVisibleContentPosition ---
    var containerRef = useRef(null);
    useResizeObserver(containerRef, onContentSizeChange);
    // --- onScroll ---
    var _d = React.useState(false), isInsideVisibleTree = _d[0], setIsInsideVisibleTree = _d[1];
    var handleScroll = useNonReactiveCallback(function () {
        var _a, _b, _c;
        if (!isInsideVisibleTree)
            return;
        var element = getScrollableNode();
        (_a = contextScrollHandlers.onScroll) === null || _a === void 0 ? void 0 : _a.call(contextScrollHandlers, {
            contentOffset: {
                x: Math.max(0, (_b = element === null || element === void 0 ? void 0 : element.scrollX) !== null && _b !== void 0 ? _b : 0),
                y: Math.max(0, (_c = element === null || element === void 0 ? void 0 : element.scrollY) !== null && _c !== void 0 ? _c : 0),
            },
            layoutMeasurement: {
                width: element === null || element === void 0 ? void 0 : element.clientWidth,
                height: element === null || element === void 0 ? void 0 : element.clientHeight,
            },
            contentSize: {
                width: element === null || element === void 0 ? void 0 : element.scrollWidth,
                height: element === null || element === void 0 ? void 0 : element.scrollHeight,
            },
        }, null);
    });
    React.useEffect(function () {
        if (!isInsideVisibleTree) {
            // Prevents hidden tabs from firing scroll events.
            // Only one list is expected to be firing these at a time.
            return;
        }
        var element = getScrollableNode();
        element === null || element === void 0 ? void 0 : element.addEventListener('scroll', handleScroll);
        return function () {
            element === null || element === void 0 ? void 0 : element.removeEventListener('scroll', handleScroll);
        };
    }, [
        isInsideVisibleTree,
        handleScroll,
        disableFullWindowScroll,
        getScrollableNode,
    ]);
    // --- onScrolledDownChange ---
    var isScrolledDown = useRef(false);
    function handleAboveTheFoldVisibleChange(isAboveTheFold) {
        var didScrollDown = !isAboveTheFold;
        if (isScrolledDown.current !== didScrollDown) {
            isScrolledDown.current = didScrollDown;
            startTransition(function () {
                onScrolledDownChange === null || onScrolledDownChange === void 0 ? void 0 : onScrolledDownChange(didScrollDown);
            });
        }
    }
    // --- onStartReached ---
    var onHeadVisibilityChange = useNonReactiveCallback(function (isHeadVisible) {
        if (isHeadVisible) {
            onStartReached === null || onStartReached === void 0 ? void 0 : onStartReached({
                distanceFromStart: onStartReachedThreshold || 0,
            });
        }
    });
    // --- onEndReached ---
    var onTailVisibilityChange = useNonReactiveCallback(function (isTailVisible) {
        if (isTailVisible) {
            onEndReached === null || onEndReached === void 0 ? void 0 : onEndReached({
                distanceFromEnd: onEndReachedThreshold || 0,
            });
        }
    });
    return (_jsxs(View, __assign({}, props, { style: [
            style,
            disableFullWindowScroll && {
                flex: 1,
                // @ts-expect-error web only
                'overflow-y': 'scroll',
            },
        ], ref: nativeRef, children: [_jsx(Visibility, { onVisibleChange: setIsInsideVisibleTree, style: 
                // This has position: fixed, so it should always report as visible
                // unless we're within a display: none tree (like a hidden tab).
                styles.parentTreeVisibilityDetector }), _jsx(Layout.Center, { children: _jsxs(View, { ref: containerRef, style: [
                        contentContainerStyle,
                        desktopFixedHeight ? styles.minHeightViewport : null,
                    ], children: [_jsx(Visibility, { root: disableFullWindowScroll ? nativeRef : null, onVisibleChange: handleAboveTheFoldVisibleChange, style: [styles.aboveTheFoldDetector, { height: headerOffset }] }), onStartReached && !isEmpty && (_jsx(EdgeVisibility, { root: disableFullWindowScroll ? nativeRef : null, onVisibleChange: onHeadVisibilityChange, topMargin: (onStartReachedThreshold !== null && onStartReachedThreshold !== void 0 ? onStartReachedThreshold : 0) * 100 + '%', containerRef: containerRef })), headerComponent, isEmpty
                            ? emptyComponent
                            : data === null || data === void 0 ? void 0 : data.map(function (item, index) {
                                var key = keyExtractor(item, index);
                                return (_jsx(Row, { item: item, index: index, renderItem: renderItem, extraData: extraData, onItemSeen: onItemSeen }, key));
                            }), onEndReached && !isEmpty && (_jsx(EdgeVisibility, { root: disableFullWindowScroll ? nativeRef : null, onVisibleChange: onTailVisibilityChange, bottomMargin: (onEndReachedThreshold !== null && onEndReachedThreshold !== void 0 ? onEndReachedThreshold : 0) * 100 + '%', containerRef: containerRef })), footerComponent] }) })] })));
}
function EdgeVisibility(_a) {
    var root = _a.root, topMargin = _a.topMargin, bottomMargin = _a.bottomMargin, containerRef = _a.containerRef, onVisibleChange = _a.onVisibleChange;
    var _b = React.useState(0), containerHeight = _b[0], setContainerHeight = _b[1];
    useResizeObserver(containerRef, function (w, h) {
        setContainerHeight(h);
    });
    return (_jsx(Visibility, { root: root, topMargin: topMargin, bottomMargin: bottomMargin, onVisibleChange: onVisibleChange }, containerHeight));
}
function useResizeObserver(ref, onResize) {
    var handleResize = useNonReactiveCallback(onResize !== null && onResize !== void 0 ? onResize : (function () { }));
    var isActive = !!onResize;
    React.useEffect(function () {
        if (!isActive) {
            return;
        }
        var resizeObserver = new ResizeObserver(function (entries) {
            batchedUpdates(function () {
                for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    var entry = entries_1[_i];
                    var rect = entry.contentRect;
                    handleResize(rect.width, rect.height);
                }
            });
        });
        var node = ref.current;
        resizeObserver.observe(node);
        return function () {
            resizeObserver.unobserve(node);
        };
    }, [handleResize, isActive, ref]);
}
var Row = function RowImpl(_a) {
    var item = _a.item, index = _a.index, renderItem = _a.renderItem, _unused = _a.extraData, onItemSeen = _a.onItemSeen;
    var rowRef = React.useRef(null);
    var intersectionTimeout = React.useRef(undefined);
    var handleIntersection = useNonReactiveCallback(function (entries) {
        batchedUpdates(function () {
            if (!onItemSeen) {
                return;
            }
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    if (!intersectionTimeout.current) {
                        intersectionTimeout.current = setTimeout(function () {
                            intersectionTimeout.current = undefined;
                            onItemSeen(item);
                        }, ON_ITEM_SEEN_WAIT_DURATION);
                    }
                }
                else {
                    if (intersectionTimeout.current) {
                        clearTimeout(intersectionTimeout.current);
                        intersectionTimeout.current = undefined;
                    }
                }
            });
        });
    });
    React.useEffect(function () {
        if (!onItemSeen) {
            return;
        }
        var observer = new IntersectionObserver(handleIntersection, ON_ITEM_SEEN_INTERSECTION_OPTS);
        var row = rowRef.current;
        observer.observe(row);
        return function () {
            observer.unobserve(row);
        };
    }, [handleIntersection, onItemSeen]);
    if (!renderItem) {
        return null;
    }
    return (_jsx(View, { ref: rowRef, children: renderItem({ item: item, index: index, separators: null }) }));
};
Row = React.memo(Row);
var Visibility = function (_a) {
    var root = _a.root, _b = _a.topMargin, topMargin = _b === void 0 ? '0px' : _b, _c = _a.bottomMargin, bottomMargin = _c === void 0 ? '0px' : _c, onVisibleChange = _a.onVisibleChange, style = _a.style;
    var tailRef = React.useRef(null);
    var isIntersecting = React.useRef(false);
    var handleIntersection = useNonReactiveCallback(function (entries) {
        batchedUpdates(function () {
            entries.forEach(function (entry) {
                if (entry.isIntersecting !== isIntersecting.current) {
                    isIntersecting.current = entry.isIntersecting;
                    onVisibleChange(entry.isIntersecting);
                }
            });
        });
    });
    React.useEffect(function () {
        var _a;
        var observer = new IntersectionObserver(handleIntersection, {
            root: (_a = root === null || root === void 0 ? void 0 : root.current) !== null && _a !== void 0 ? _a : null,
            rootMargin: "".concat(topMargin, " 0px ").concat(bottomMargin, " 0px"),
        });
        var tail = tailRef.current;
        observer.observe(tail);
        return function () {
            observer.unobserve(tail);
        };
    }, [bottomMargin, handleIntersection, topMargin, root]);
    return (_jsx(View, { ref: tailRef, style: addStyle(styles.visibilityDetector, style) }));
};
Visibility = React.memo(Visibility);
export var List = memo(React.forwardRef(ListImpl));
// https://stackoverflow.com/questions/7944460/detect-safari-browser
var styles = StyleSheet.create({
    minHeightViewport: {
        // @ts-ignore web only
        minHeight: '100vh',
    },
    parentTreeVisibilityDetector: {
        // @ts-ignore web only
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    aboveTheFoldDetector: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        // Bottom is dynamic.
    },
    visibilityDetector: {
        pointerEvents: 'none',
        zIndex: -1,
    },
});
