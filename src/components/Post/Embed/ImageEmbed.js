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
import { jsx as _jsx } from "react/jsx-runtime";
import { InteractionManager, View } from 'react-native';
import { measure, runOnJS, runOnUI, } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useLightboxControls } from '#/state/lightbox';
import { atoms as a } from '#/alf';
import { AutoSizedImage } from '#/components/images/AutoSizedImage';
import { ImageLayoutGrid } from '#/components/images/ImageLayoutGrid';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
export function ImageEmbed(_a) {
    var embed = _a.embed, rest = __rest(_a, ["embed"]);
    var openLightbox = useLightboxControls().openLightbox;
    var images = embed.view.images;
    if (images.length > 0) {
        var items_1 = images.map(function (img) {
            var _a;
            return ({
                uri: img.fullsize,
                thumbUri: img.thumb,
                alt: img.alt,
                dimensions: (_a = img.aspectRatio) !== null && _a !== void 0 ? _a : null,
            });
        });
        var _openLightbox_1 = function (index, thumbRects, fetchedDims) {
            openLightbox({
                images: items_1.map(function (item, i) {
                    var _a, _b;
                    return (__assign(__assign({}, item), { thumbRect: (_a = thumbRects[i]) !== null && _a !== void 0 ? _a : null, thumbDimensions: (_b = fetchedDims[i]) !== null && _b !== void 0 ? _b : null, type: 'image' }));
                }),
                index: index,
            });
        };
        var onPress_1 = function (index, refs, fetchedDims) {
            runOnUI(function () {
                'worklet';
                var rects = [];
                for (var _i = 0, refs_1 = refs; _i < refs_1.length; _i++) {
                    var r = refs_1[_i];
                    rects.push(measure(r));
                }
                runOnJS(_openLightbox_1)(index, rects, fetchedDims);
            })();
        };
        var onPressIn_1 = function (_) {
            InteractionManager.runAfterInteractions(function () {
                Image.prefetch(items_1.map(function (i) { return i.uri; }), 'memory');
            });
        };
        if (images.length === 1) {
            var image = images[0];
            return (_jsx(View, { style: [a.mt_sm, rest.style], children: _jsx(AutoSizedImage, { crop: rest.viewContext === PostEmbedViewContext.ThreadHighlighted
                        ? 'none'
                        : rest.viewContext ===
                            PostEmbedViewContext.FeedEmbedRecordWithMedia
                            ? 'square'
                            : 'constrained', image: image, onPress: function (containerRef, dims) { return onPress_1(0, [containerRef], [dims]); }, onPressIn: function () { return onPressIn_1(0); }, hideBadge: rest.viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia }) }));
        }
        return (_jsx(View, { style: [a.mt_sm, rest.style], children: _jsx(ImageLayoutGrid, { images: images, onPress: onPress_1, onPressIn: onPressIn_1, viewContext: rest.viewContext }) }));
    }
}
