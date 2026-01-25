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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View, } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { colors, s } from '#/lib/styles';
import { cropImage } from '#/state/gallery';
import { Text } from '#/view/com/util/text/Text';
import { tokens, useTheme } from '#/alf';
import * as Dialog from '#/components/Dialog';
import { MediaInsetBorder } from '#/components/MediaInsetBorder';
import { IS_NATIVE } from '#/env';
import { EditImageDialog } from './EditImageDialog';
import { ImageAltTextDialog } from './ImageAltTextDialog';
var IMAGE_GAP = 8;
export var Gallery = function (props) {
    var _a;
    var containerInfo = (_a = React.useState(), _a[0]), setContainerInfo = _a[1];
    var onLayout = function (evt) {
        var _a = evt.nativeEvent.layout, width = _a.width, height = _a.height;
        setContainerInfo({
            width: width,
            height: height,
        });
    };
    return (_jsx(View, { onLayout: onLayout, children: containerInfo ? (_jsx(GalleryInner, __assign({}, props, { containerInfo: containerInfo }))) : undefined }));
};
Gallery = React.memo(Gallery);
var GalleryInner = function (_a) {
    var images = _a.images, containerInfo = _a.containerInfo, dispatch = _a.dispatch;
    var isMobile = useWebMediaQueries().isMobile;
    var _b = React.useMemo(function () {
        var side = images.length === 1
            ? 250
            : (containerInfo.width - IMAGE_GAP * (images.length - 1)) /
                images.length;
        var isOverflow = isMobile && images.length > 2;
        return {
            altTextControlStyle: isOverflow
                ? { left: 4, bottom: 4 }
                : !isMobile && images.length < 3
                    ? { left: 8, top: 8 }
                    : { left: 4, top: 4 },
            imageControlsStyle: __assign(__assign({ display: 'flex', flexDirection: 'row', position: 'absolute' }, (isOverflow
                ? { top: 4, right: 4, gap: 4 }
                : !isMobile && images.length < 3
                    ? { top: 8, right: 8, gap: 8 }
                    : { top: 4, right: 4, gap: 4 })), { zIndex: 1 }),
            imageStyle: {
                height: side,
                width: side,
            },
        };
    }, [images.length, containerInfo, isMobile]), altTextControlStyle = _b.altTextControlStyle, imageControlsStyle = _b.imageControlsStyle, imageStyle = _b.imageStyle;
    return images.length !== 0 ? (_jsxs(_Fragment, { children: [_jsx(View, { testID: "selectedPhotosView", style: styles.gallery, children: images.map(function (image) {
                    return (_jsx(GalleryItem, { image: image, altTextControlStyle: altTextControlStyle, imageControlsStyle: imageControlsStyle, imageStyle: imageStyle, onChange: function (next) {
                            dispatch({ type: 'embed_update_image', image: next });
                        }, onRemove: function () {
                            dispatch({ type: 'embed_remove_image', image: image });
                        } }, image.source.id));
                }) }), _jsx(AltTextReminder, {})] })) : null;
};
var GalleryItem = function (_a) {
    var _b;
    var image = _a.image, altTextControlStyle = _a.altTextControlStyle, imageControlsStyle = _a.imageControlsStyle, imageStyle = _a.imageStyle, onChange = _a.onChange, onRemove = _a.onRemove;
    var _ = useLingui()._;
    var t = useTheme();
    var altTextControl = Dialog.useDialogControl();
    var editControl = Dialog.useDialogControl();
    var onImageEdit = function () {
        if (IS_NATIVE) {
            cropImage(image).then(function (next) {
                onChange(next);
            });
        }
        else {
            editControl.open();
        }
    };
    var onAltTextEdit = function () {
        Keyboard.dismiss();
        altTextControl.open();
    };
    return (_jsxs(View, { style: imageStyle, 
        // Fixes ALT and icons appearing with half opacity when the post is inactive
        renderToHardwareTextureAndroid: true, children: [_jsxs(TouchableOpacity, { testID: "altTextButton", accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Add alt text"], ["Add alt text"])))), accessibilityHint: "", onPress: onAltTextEdit, style: [styles.altTextControl, altTextControlStyle], children: [image.alt.length !== 0 ? (_jsx(FontAwesomeIcon, { icon: "check", size: 10, style: { color: t.palette.white } })) : (_jsx(FontAwesomeIcon, { icon: "plus", size: 10, style: { color: t.palette.white } })), _jsx(Text, { style: styles.altTextControlLabel, accessible: false, children: _jsx(Trans, { children: "ALT" }) })] }), _jsxs(View, { style: imageControlsStyle, children: [_jsx(TouchableOpacity, { testID: "editPhotoButton", accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Edit image"], ["Edit image"])))), accessibilityHint: "", onPress: onImageEdit, style: styles.imageControl, children: _jsx(FontAwesomeIcon, { icon: "pen", size: 12, style: { color: colors.white } }) }), _jsx(TouchableOpacity, { testID: "removePhotoButton", accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Remove image"], ["Remove image"])))), accessibilityHint: "", onPress: onRemove, style: styles.imageControl, children: _jsx(FontAwesomeIcon, { icon: "xmark", size: 16, style: { color: colors.white } }) })] }), _jsx(TouchableOpacity, { accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Add alt text"], ["Add alt text"])))), accessibilityHint: "", onPress: onAltTextEdit, style: styles.altTextHiddenRegion }), _jsx(Image, { testID: "selectedPhotoImage", style: [styles.image, imageStyle], source: {
                    uri: ((_b = image.transformed) !== null && _b !== void 0 ? _b : image.source).path,
                }, accessible: true, accessibilityIgnoresInvertColors: true, cachePolicy: "none", autoplay: false, contentFit: "cover" }), _jsx(MediaInsetBorder, {}), _jsx(ImageAltTextDialog, { control: altTextControl, image: image, onChange: onChange }), _jsx(EditImageDialog, { control: editControl, image: image, onChange: onChange })] }));
};
export function AltTextReminder() {
    var t = useTheme();
    return (_jsxs(View, { style: [styles.reminder], children: [_jsx(View, { style: [styles.infoIcon, t.atoms.bg_contrast_25], children: _jsx(FontAwesomeIcon, { icon: "info", size: 12, color: t.atoms.text.color }) }), _jsx(Text, { type: "sm", style: [t.atoms.text_contrast_medium, s.flex1], children: _jsx(Trans, { children: "Alt text describes images for blind and low-vision users, and helps give context to everyone." }) })] }));
}
var styles = StyleSheet.create({
    gallery: {
        flex: 1,
        flexDirection: 'row',
        gap: IMAGE_GAP,
        marginTop: 16,
    },
    image: {
        borderRadius: tokens.borderRadius.md,
    },
    imageControl: {
        width: 24,
        height: 24,
        borderRadius: tokens.borderRadius.md,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    altTextControl: {
        position: 'absolute',
        zIndex: 1,
        borderRadius: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    altTextControlLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    altTextHiddenRegion: {
        position: 'absolute',
        left: 4,
        right: 4,
        bottom: 4,
        top: 30,
        zIndex: 1,
    },
    reminder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        paddingVertical: 14,
    },
    infoIcon: {
        width: 22,
        height: 22,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
