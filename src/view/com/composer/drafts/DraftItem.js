var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import * as device from '#/lib/deviceName';
import { logger } from '#/view/com/composer/drafts/state/logger';
import { TimeElapsed } from '#/view/com/util/TimeElapsed';
import { atoms as a, select, useTheme } from '#/alf';
import { Button } from '#/components/Button';
import { CirclePlus_Stroke2_Corner0_Rounded as CirclePlusIcon } from '#/components/icons/CirclePlus';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon } from '#/components/icons/DotGrid';
import { CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon } from '#/components/icons/Quote';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as MediaPreview from '#/components/MediaPreview';
import * as Prompt from '#/components/Prompt';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
import * as storage from './state/storage';
export function DraftItem(_a) {
    var draft = _a.draft, onSelect = _a.onSelect, onDelete = _a.onDelete;
    var _ = useLingui()._;
    var t = useTheme();
    var discardPromptControl = Prompt.usePromptControl();
    var post = draft.posts[0];
    var mediaExistsOnOtherDevice = !draft.meta.isOriginatingDevice && draft.meta.hasMissingMedia;
    var mediaIsMissing = draft.meta.isOriginatingDevice && draft.meta.hasMissingMedia;
    var hasMetadata = draft.meta.replyCount > 0 ||
        mediaExistsOnOtherDevice ||
        draft.meta.hasQuotes;
    var isUnknownDevice = useMemo(function () {
        var raw = draft.draft.deviceName;
        switch (raw) {
            case device.FALLBACK_IOS:
            case device.FALLBACK_ANDROID:
            case device.FALLBACK_WEB:
                return true;
            default:
                return false;
        }
    }, [draft]);
    var handleDelete = useCallback(function () {
        onDelete(draft);
    }, [onDelete, draft]);
    return (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.relative], children: [_jsx(Pressable, { accessibilityRole: "button", accessibilityLabel: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Open draft"], ["Open draft"])))), accessibilityHint: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Opens this draft in the composer"], ["Opens this draft in the composer"])))), onPress: function () { return onSelect(draft); }, style: function (_a) {
                            var pressed = _a.pressed, hovered = _a.hovered;
                            return [
                                a.rounded_md,
                                a.border,
                                t.atoms.shadow_sm,
                                pressed || hovered
                                    ? t.atoms.border_contrast_medium
                                    : t.atoms.border_contrast_low,
                                {
                                    backgroundColor: select(t.name, {
                                        light: t.atoms.bg.backgroundColor,
                                        dark: t.atoms.bg_contrast_25.backgroundColor,
                                        dim: t.atoms.bg_contrast_25.backgroundColor,
                                    }),
                                },
                            ];
                        }, children: _jsxs(View, { style: [
                                a.rounded_md,
                                a.overflow_hidden,
                                a.p_lg,
                                a.pb_md,
                                a.gap_sm,
                                {
                                    paddingTop: 20 + a.pt_md.paddingTop,
                                },
                            ], children: [!!post.text.trim().length && (_jsx(RichText, { style: [a.text_md, a.leading_snug, a.pointer_events_none], numberOfLines: 8, value: post.text, enableTags: true, disableMentionFacetValidation: true })), !mediaExistsOnOtherDevice && _jsx(DraftMediaPreview, { post: post }), hasMetadata && (_jsxs(View, { style: [a.gap_xs], children: [mediaExistsOnOtherDevice && (_jsx(DraftMetadataTag, { icon: WarningIcon, text: isUnknownDevice
                                                ? _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Media stored on another device"], ["Media stored on another device"]))))
                                                : _(msg({
                                                    message: "Media stored on ".concat(draft.draft.deviceName),
                                                    comment: "Example: \"Media stored on John's iPhone\"",
                                                })) })), mediaIsMissing && (_jsx(DraftMetadataTag, { display: "warning", icon: WarningIcon, text: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Missing media"], ["Missing media"])))) })), draft.meta.hasQuotes && (_jsx(DraftMetadataTag, { icon: CloseQuoteIcon, text: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Quote post"], ["Quote post"])))) })), draft.meta.replyCount > 0 && (_jsx(DraftMetadataTag, { icon: CirclePlusIcon, text: plural(draft.meta.replyCount, {
                                                one: '1 more post',
                                                other: '# more posts',
                                            }) }))] }))] }) }), _jsx(View, { pointerEvents: "none", style: [
                            a.absolute,
                            a.pointer_events_none,
                            {
                                top: a.pt_md.paddingTop,
                                left: a.pl_lg.paddingLeft,
                            },
                        ], children: _jsx(TimeElapsed, { timestamp: draft.updatedAt, children: function (_a) {
                                var timeElapsed = _a.timeElapsed;
                                return (_jsx(Text, { style: [
                                        a.text_sm,
                                        t.atoms.text_contrast_medium,
                                        a.leading_tight,
                                    ], numberOfLines: 1, children: timeElapsed }));
                            } }) }), _jsx(View, { style: [
                            a.absolute,
                            {
                                top: a.pt_md.paddingTop,
                                right: a.pr_md.paddingRight,
                            },
                        ], children: _jsx(Button, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["More options"], ["More options"])))), hitSlop: 8, onPress: function (e) {
                                e.stopPropagation();
                                discardPromptControl.open();
                            }, style: [
                                a.pointer,
                                a.rounded_full,
                                {
                                    height: 20,
                                    width: 20,
                                },
                            ], children: function (_a) {
                                var pressed = _a.pressed, hovered = _a.hovered;
                                return (_jsxs(_Fragment, { children: [_jsx(View, { style: [
                                                a.absolute,
                                                a.rounded_full,
                                                {
                                                    top: -4,
                                                    bottom: -4,
                                                    left: -4,
                                                    right: -4,
                                                    backgroundColor: pressed || hovered
                                                        ? select(t.name, {
                                                            light: t.atoms.bg_contrast_50.backgroundColor,
                                                            dark: t.atoms.bg_contrast_100.backgroundColor,
                                                            dim: t.atoms.bg_contrast_100.backgroundColor,
                                                        })
                                                        : 'transparent',
                                                },
                                            ] }), _jsx(DotsIcon, { width: 16, fill: t.atoms.text_contrast_low.color, style: [a.z_20] })] }));
                            } }) })] }), _jsx(Prompt.Basic, { control: discardPromptControl, title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Discard draft?"], ["Discard draft?"])))), description: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["This draft will be permanently deleted."], ["This draft will be permanently deleted."])))), onConfirm: handleDelete, confirmButtonCta: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Discard"], ["Discard"])))), confirmButtonColor: "negative" })] }));
}
function DraftMetadataTag(_a) {
    var _b = _a.display, display = _b === void 0 ? 'info' : _b, Icon = _a.icon, text = _a.text;
    var t = useTheme();
    var color = {
        info: t.atoms.text_contrast_medium.color,
        warning: select(t.name, {
            light: '#C99A00',
            dark: '#FFC404',
            dim: '#FFC404',
        }),
    }[display];
    return (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_xs], children: [_jsx(Icon, { size: "sm", fill: color }), _jsx(Text, { style: [a.text_sm, a.leading_tight, { color: color }], children: text })] }));
}
function DraftMediaPreview(_a) {
    var post = _a.post;
    var _b = useState([]), loadedImages = _b[0], setLoadedImages = _b[1];
    var _c = useState(), videoThumbnail = _c[0], setVideoThumbnail = _c[1];
    useEffect(function () {
        function loadMedia() {
            return __awaiter(this, void 0, void 0, function () {
                var loaded, _i, _a, image, url, e_1, url, thumbnail, e_2;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!(post.images && post.images.length > 0)) return [3 /*break*/, 7];
                            loaded = [];
                            _i = 0, _a = post.images;
                            _c.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 6];
                            image = _a[_i];
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, storage.loadMediaFromLocal(image.localPath)];
                        case 3:
                            url = _c.sent();
                            loaded.push({ url: url, alt: image.altText || '' });
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _c.sent();
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6:
                            setLoadedImages(loaded);
                            _c.label = 7;
                        case 7:
                            if (!(((_b = post.video) === null || _b === void 0 ? void 0 : _b.exists) && post.video.localPath)) return [3 /*break*/, 14];
                            _c.label = 8;
                        case 8:
                            _c.trys.push([8, 13, , 14]);
                            return [4 /*yield*/, storage.loadMediaFromLocal(post.video.localPath)];
                        case 9:
                            url = _c.sent();
                            if (!IS_WEB) return [3 /*break*/, 10];
                            // can't generate thumbnails on web
                            setVideoThumbnail("yep, there's a video");
                            return [3 /*break*/, 12];
                        case 10:
                            logger.debug('generating thumbnail of ', { url: url });
                            return [4 /*yield*/, VideoThumbnails.getThumbnailAsync(url, {
                                    time: 0,
                                    quality: 0.2,
                                })];
                        case 11:
                            thumbnail = _c.sent();
                            logger.debug('thumbnail generated', { thumbnail: thumbnail });
                            setVideoThumbnail(thumbnail.uri);
                            _c.label = 12;
                        case 12: return [3 /*break*/, 14];
                        case 13:
                            e_2 = _c.sent();
                            return [3 /*break*/, 14];
                        case 14: return [2 /*return*/];
                    }
                });
            });
        }
        void loadMedia();
    }, [post.images, post.video]);
    // Nothing to show
    if (loadedImages.length === 0 && !post.gif && !post.video) {
        return null;
    }
    return (_jsxs(MediaPreview.Outer, { children: [loadedImages.map(function (image, i) { return (_jsx(MediaPreview.ImageItem, { thumbnail: image.url, alt: image.alt }, i)); }), post.gif && (_jsx(MediaPreview.GifItem, { thumbnail: post.gif.url, alt: post.gif.alt })), post.video && videoThumbnail && (_jsx(MediaPreview.VideoItem, { thumbnail: IS_WEB ? undefined : videoThumbnail, alt: post.video.altText }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
