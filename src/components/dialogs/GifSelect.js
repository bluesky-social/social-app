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
import { useCallback, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { View } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { cleanError } from '#/lib/strings/errors';
import { tenorUrlToBskyGifUrl, useFeaturedGifsQuery, useGifSearchQuery, } from '#/state/queries/tenor';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { atoms as a, ios, native, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { useThrottledValue } from '#/components/hooks/useThrottledValue';
import { ArrowLeft_Stroke2_Corner0_Rounded as Arrow } from '#/components/icons/Arrow';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as Search } from '#/components/icons/MagnifyingGlass';
import { ListFooter, ListMaybePlaceholder } from '#/components/Lists';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
export function GifSelectDialog(_a) {
    var controlRef = _a.controlRef, onClose = _a.onClose, onSelectGifProp = _a.onSelectGif;
    var control = Dialog.useDialogControl();
    useImperativeHandle(controlRef, function () { return ({
        open: function () { return control.open(); },
    }); });
    var onSelectGif = useCallback(function (gif) {
        control.close(function () { return onSelectGifProp(gif); });
    }, [control, onSelectGifProp]);
    var renderErrorBoundary = useCallback(function (error) { return _jsx(DialogError, { details: String(error) }); }, []);
    return (_jsxs(Dialog.Outer, { control: control, onClose: onClose, nativeOptions: __assign({ bottomInset: 0 }, ios({ cornerRadius: undefined })), children: [_jsx(Dialog.Handle, {}), _jsx(ErrorBoundary, { renderError: renderErrorBoundary, children: _jsx(GifList, { control: control, onSelectGif: onSelectGif }) })] }));
}
function GifList(_a) {
    var control = _a.control, onSelectGif = _a.onSelectGif;
    var _ = useLingui()._;
    var t = useTheme();
    var gtMobile = useBreakpoints().gtMobile;
    var textInputRef = useRef(null);
    var listRef = useRef(null);
    var _b = useState(''), undeferredSearch = _b[0], setSearch = _b[1];
    var search = useThrottledValue(undeferredSearch, 500);
    var height = useWindowDimensions().height;
    var isSearching = search.length > 0;
    var trendingQuery = useFeaturedGifsQuery();
    var searchQuery = useGifSearchQuery(search);
    var _c = isSearching ? searchQuery : trendingQuery, data = _c.data, fetchNextPage = _c.fetchNextPage, isFetchingNextPage = _c.isFetchingNextPage, hasNextPage = _c.hasNextPage, error = _c.error, isPending = _c.isPending, isError = _c.isError, refetch = _c.refetch;
    var flattenedData = useMemo(function () {
        return (data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.results; })) || [];
    }, [data]);
    var renderItem = useCallback(function (_a) {
        var item = _a.item;
        return _jsx(GifPreview, { gif: item, onSelectGif: onSelectGif });
    }, [onSelectGif]);
    var onEndReached = useCallback(function () {
        if (isFetchingNextPage || !hasNextPage || error)
            return;
        fetchNextPage();
    }, [isFetchingNextPage, hasNextPage, error, fetchNextPage]);
    var hasData = flattenedData.length > 0;
    var onGoBack = useCallback(function () {
        var _a;
        if (isSearching) {
            // clear the input and reset the state
            (_a = textInputRef.current) === null || _a === void 0 ? void 0 : _a.clear();
            setSearch('');
        }
        else {
            control.close();
        }
    }, [control, isSearching]);
    var listHeader = useMemo(function () {
        return (_jsxs(View, { style: [
                native(a.pt_4xl),
                a.relative,
                a.mb_lg,
                a.flex_row,
                a.align_center,
                !gtMobile && web(a.gap_md),
                a.pb_sm,
                t.atoms.bg,
            ], children: [!gtMobile && IS_WEB && (_jsx(Button, { size: "small", variant: "ghost", color: "secondary", shape: "round", onPress: function () { return control.close(); }, label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Close GIF dialog"], ["Close GIF dialog"])))), children: _jsx(ButtonIcon, { icon: Arrow, size: "md" }) })), _jsxs(TextField.Root, { style: [!gtMobile && IS_WEB && a.flex_1], children: [_jsx(TextField.Icon, { icon: Search }), _jsx(TextField.Input, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Search GIFs"], ["Search GIFs"])))), placeholder: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Search Tenor"], ["Search Tenor"])))), onChangeText: function (text) {
                                var _a;
                                setSearch(text);
                                (_a = listRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({ offset: 0, animated: false });
                            }, returnKeyType: "search", clearButtonMode: "while-editing", inputRef: textInputRef, maxLength: 50, onKeyPress: function (_a) {
                                var nativeEvent = _a.nativeEvent;
                                if (nativeEvent.key === 'Escape') {
                                    control.close();
                                }
                            } })] })] }));
    }, [gtMobile, t.atoms.bg, _, control]);
    return (_jsxs(_Fragment, { children: [gtMobile && _jsx(Dialog.Close, {}), _jsx(Dialog.InnerFlatList, { ref: listRef, data: flattenedData, renderItem: renderItem, numColumns: gtMobile ? 3 : 2, columnWrapperStyle: [a.gap_sm], contentContainerStyle: [native([a.px_xl, { minHeight: height }])], webInnerStyle: [web({ minHeight: '80vh' })], webInnerContentContainerStyle: [web(a.pb_0)], ListHeaderComponent: _jsxs(_Fragment, { children: [listHeader, !hasData && (_jsx(ListMaybePlaceholder, { isLoading: isPending, isError: isError, onRetry: refetch, onGoBack: onGoBack, emptyType: "results", sideBorders: false, topBorder: false, errorTitle: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Failed to load GIFs"], ["Failed to load GIFs"])))), errorMessage: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["There was an issue connecting to Tenor."], ["There was an issue connecting to Tenor."])))), emptyMessage: isSearching
                                ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["No search results found for \"", "\"."], ["No search results found for \"", "\"."])), search))
                                : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["No featured GIFs found. There may be an issue with Tenor."], ["No featured GIFs found. There may be an issue with Tenor."])))) }))] }), stickyHeaderIndices: [0], onEndReached: onEndReached, onEndReachedThreshold: 4, keyExtractor: function (item) { return item.id; }, keyboardDismissMode: "on-drag", ListFooterComponent: hasData ? (_jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, error: cleanError(error), onRetry: fetchNextPage, style: { borderTopWidth: 0 } })) : null }, gtMobile ? '3 cols' : '2 cols')] }));
}
function DialogError(_a) {
    var details = _a.details;
    var _ = useLingui()._;
    var control = Dialog.useDialogContext();
    return (_jsxs(Dialog.ScrollableInner, { style: a.gap_md, label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["An error has occurred"], ["An error has occurred"])))), children: [_jsx(Dialog.Close, {}), _jsx(ErrorScreen, { title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Oh no!"], ["Oh no!"])))), message: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["There was an unexpected issue in the application. Please let us know if this happened to you!"], ["There was an unexpected issue in the application. Please let us know if this happened to you!"])))), details: details }), _jsx(Button, { label: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Close dialog"], ["Close dialog"])))), onPress: function () { return control.close(); }, color: "primary", size: "large", variant: "solid", children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Close" }) }) })] }));
}
export function GifPreview(_a) {
    var gif = _a.gif, onSelectGif = _a.onSelectGif;
    var ax = useAnalytics();
    var gtTablet = useBreakpoints().gtTablet;
    var _ = useLingui()._;
    var t = useTheme();
    var onPress = useCallback(function () {
        ax.metric('composer:gif:select', {});
        onSelectGif(gif);
    }, [ax, onSelectGif, gif]);
    return (_jsx(Button, { label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Select GIF \"", "\""], ["Select GIF \"", "\""])), gif.title)), style: [a.flex_1, gtTablet ? { maxWidth: '33%' } : { maxWidth: '50%' }], onPress: onPress, children: function (_a) {
            var pressed = _a.pressed;
            return (_jsx(Image, { style: [
                    a.flex_1,
                    a.mb_sm,
                    a.rounded_sm,
                    a.aspect_square,
                    { opacity: pressed ? 0.8 : 1 },
                    t.atoms.bg_contrast_25,
                ], source: {
                    uri: tenorUrlToBskyGifUrl(gif.media_formats.tinygif.url),
                }, contentFit: "cover", accessibilityLabel: gif.title, accessibilityHint: "", cachePolicy: "none", accessibilityIgnoresInvertColors: true }));
        } }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;
