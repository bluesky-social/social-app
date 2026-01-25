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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { View } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import { atoms as a, useBreakpoints } from '#/alf';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
import { GalleryItem } from './Gallery';
export function ImageLayoutGrid(_a) {
    var style = _a.style, props = __rest(_a, ["style"]);
    var gtMobile = useBreakpoints().gtMobile;
    var gap = props.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
        ? gtMobile
            ? a.gap_xs
            : a.gap_2xs
        : a.gap_xs;
    return (_jsx(View, { style: style, children: _jsx(View, { style: [gap, a.rounded_md, a.overflow_hidden], children: _jsx(ImageLayoutGridInner, __assign({}, props, { gap: gap })) }) }));
}
function ImageLayoutGridInner(props) {
    var gap = props.gap;
    var count = props.images.length;
    var containerRef1 = useAnimatedRef();
    var containerRef2 = useAnimatedRef();
    var containerRef3 = useAnimatedRef();
    var containerRef4 = useAnimatedRef();
    var thumbDimsRef = useRef([]);
    switch (count) {
        case 2: {
            var containerRefs = [containerRef1, containerRef2];
            return (_jsxs(View, { style: [a.flex_1, a.flex_row, gap], children: [_jsx(View, { style: [a.flex_1, a.aspect_square], children: _jsx(GalleryItem, __assign({}, props, { index: 0, insetBorderStyle: noCorners(['topRight', 'bottomRight']), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) }), _jsx(View, { style: [a.flex_1, a.aspect_square], children: _jsx(GalleryItem, __assign({}, props, { index: 1, insetBorderStyle: noCorners(['topLeft', 'bottomLeft']), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) })] }));
        }
        case 3: {
            var containerRefs = [containerRef1, containerRef2, containerRef3];
            return (_jsxs(View, { style: [a.flex_1, a.flex_row, gap], children: [_jsx(View, { style: [a.flex_1, a.aspect_square], children: _jsx(GalleryItem, __assign({}, props, { index: 0, insetBorderStyle: noCorners(['topRight', 'bottomRight']), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) }), _jsxs(View, { style: [a.flex_1, a.aspect_square, gap], children: [_jsx(View, { style: [a.flex_1], children: _jsx(GalleryItem, __assign({}, props, { index: 1, insetBorderStyle: noCorners([
                                        'topLeft',
                                        'bottomLeft',
                                        'bottomRight',
                                    ]), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) }), _jsx(View, { style: [a.flex_1], children: _jsx(GalleryItem, __assign({}, props, { index: 2, insetBorderStyle: noCorners([
                                        'topLeft',
                                        'bottomLeft',
                                        'topRight',
                                    ]), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) })] })] }));
        }
        case 4: {
            var containerRefs = [
                containerRef1,
                containerRef2,
                containerRef3,
                containerRef4,
            ];
            return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.flex_row, gap], children: [_jsx(View, { style: [a.flex_1, { aspectRatio: 1.5 }], children: _jsx(GalleryItem, __assign({}, props, { index: 0, insetBorderStyle: noCorners([
                                        'bottomLeft',
                                        'topRight',
                                        'bottomRight',
                                    ]), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) }), _jsx(View, { style: [a.flex_1, { aspectRatio: 1.5 }], children: _jsx(GalleryItem, __assign({}, props, { index: 1, insetBorderStyle: noCorners([
                                        'topLeft',
                                        'bottomLeft',
                                        'bottomRight',
                                    ]), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) })] }), _jsxs(View, { style: [a.flex_row, gap], children: [_jsx(View, { style: [a.flex_1, { aspectRatio: 1.5 }], children: _jsx(GalleryItem, __assign({}, props, { index: 2, insetBorderStyle: noCorners([
                                        'topLeft',
                                        'topRight',
                                        'bottomRight',
                                    ]), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) }), _jsx(View, { style: [a.flex_1, { aspectRatio: 1.5 }], children: _jsx(GalleryItem, __assign({}, props, { index: 3, insetBorderStyle: noCorners([
                                        'topLeft',
                                        'bottomLeft',
                                        'topRight',
                                    ]), containerRefs: containerRefs, thumbDimsRef: thumbDimsRef })) })] })] }));
        }
        default:
            return null;
    }
}
function noCorners(corners) {
    var styles = [];
    if (corners.includes('topLeft')) {
        styles.push({ borderTopLeftRadius: 0 });
    }
    if (corners.includes('topRight')) {
        styles.push({ borderTopRightRadius: 0 });
    }
    if (corners.includes('bottomLeft')) {
        styles.push({ borderBottomLeftRadius: 0 });
    }
    if (corners.includes('bottomRight')) {
        styles.push({ borderBottomRightRadius: 0 });
    }
    return styles;
}
