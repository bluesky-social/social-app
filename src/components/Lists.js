var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { View } from 'react-native';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { cleanError } from '#/lib/strings/errors';
import { EmptyState, } from '#/view/com/util/EmptyState';
import { CenteredView } from '#/view/com/util/Views';
import { atoms as a, useBreakpoints, useTheme } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import { Error } from '#/components/Error';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
export function ListFooter(_a) {
    var isFetchingNextPage = _a.isFetchingNextPage, hasNextPage = _a.hasNextPage, error = _a.error, onRetry = _a.onRetry, height = _a.height, style = _a.style, _b = _a.showEndMessage, showEndMessage = _b === void 0 ? false : _b, endMessageText = _a.endMessageText, renderEndMessage = _a.renderEndMessage;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.w_full,
            a.align_center,
            a.border_t,
            a.pb_lg,
            t.atoms.border_contrast_low,
            { height: height !== null && height !== void 0 ? height : 180, paddingTop: 30 },
            style,
        ], children: isFetchingNextPage ? (_jsx(Loader, { size: "xl" })) : error ? (_jsx(ListFooterMaybeError, { error: error, onRetry: onRetry })) : !hasNextPage && showEndMessage ? (renderEndMessage ? (renderEndMessage()) : (_jsx(Text, { style: [a.text_sm, t.atoms.text_contrast_low], children: endMessageText !== null && endMessageText !== void 0 ? endMessageText : _jsx(Trans, { children: "You have reached the end" }) }))) : null }));
}
function ListFooterMaybeError(_a) {
    var error = _a.error, onRetry = _a.onRetry;
    var t = useTheme();
    var _ = useLingui()._;
    if (!error)
        return null;
    return (_jsx(View, { style: [a.w_full, a.px_lg], children: _jsxs(View, { style: [
                a.flex_row,
                a.gap_md,
                a.p_md,
                a.rounded_sm,
                a.align_center,
                t.atoms.bg_contrast_25,
            ], children: [_jsx(Text, { style: [a.flex_1, a.text_sm, t.atoms.text_contrast_medium], numberOfLines: 2, children: error ? (cleanError(error)) : (_jsx(Trans, { children: "Oops, something went wrong!" })) }), _jsx(Button, { variant: "solid", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Press to retry"], ["Press to retry"])))), style: [
                        a.align_center,
                        a.justify_center,
                        a.rounded_sm,
                        a.overflow_hidden,
                        a.px_md,
                        a.py_sm,
                    ], onPress: onRetry, children: _jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }) })] }) }));
}
var ListMaybePlaceholder = function (_a) {
    var isLoading = _a.isLoading, noEmpty = _a.noEmpty, isError = _a.isError, emptyTitle = _a.emptyTitle, emptyMessage = _a.emptyMessage, errorTitle = _a.errorTitle, errorMessage = _a.errorMessage, _b = _a.emptyType, emptyType = _b === void 0 ? 'page' : _b, onRetry = _a.onRetry, onGoBack = _a.onGoBack, hideBackButton = _a.hideBackButton, sideBorders = _a.sideBorders, _c = _a.topBorder, topBorder = _c === void 0 ? false : _c, emptyStateIcon = _a.emptyStateIcon, emptyStateButton = _a.emptyStateButton, _d = _a.useEmptyState, useEmptyState = _d === void 0 ? false : _d;
    var t = useTheme();
    var _ = useLingui()._;
    var _e = useBreakpoints(), gtMobile = _e.gtMobile, gtTablet = _e.gtTablet;
    if (isLoading) {
        return (_jsx(CenteredView, { style: [
                a.h_full_vh,
                a.align_center,
                !gtMobile ? a.justify_between : a.gap_5xl,
                t.atoms.border_contrast_low,
                { paddingTop: 175, paddingBottom: 110 },
            ], sideBorders: sideBorders !== null && sideBorders !== void 0 ? sideBorders : gtMobile, topBorder: topBorder && !gtTablet, children: _jsx(View, { style: [a.w_full, a.align_center, { top: 100 }], children: _jsx(Loader, { size: "xl" }) }) }));
    }
    if (isError) {
        return (_jsx(Error, { title: errorTitle !== null && errorTitle !== void 0 ? errorTitle : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Oops!"], ["Oops!"])))), message: errorMessage !== null && errorMessage !== void 0 ? errorMessage : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Something went wrong!"], ["Something went wrong!"])))), onRetry: onRetry, onGoBack: onGoBack, sideBorders: sideBorders, hideBackButton: hideBackButton }));
    }
    if (useEmptyState) {
        return (_jsx(CenteredView, { style: [t.atoms.border_contrast_low], sideBorders: sideBorders !== null && sideBorders !== void 0 ? sideBorders : gtMobile, children: _jsx(EmptyState, { icon: emptyStateIcon, message: emptyMessage !== null && emptyMessage !== void 0 ? emptyMessage : (emptyType === 'results'
                    ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["No results found"], ["No results found"]))))
                    : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Page not found"], ["Page not found"]))))), button: emptyStateButton }) }));
    }
    if (!noEmpty) {
        return (_jsx(Error, { title: emptyTitle !== null && emptyTitle !== void 0 ? emptyTitle : (emptyType === 'results'
                ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["No results found"], ["No results found"]))))
                : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Page not found"], ["Page not found"]))))), message: emptyMessage !== null && emptyMessage !== void 0 ? emptyMessage : _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["We're sorry! We can't find the page you were looking for."], ["We're sorry! We can't find the page you were looking for."])))), onRetry: onRetry, onGoBack: onGoBack, hideBackButton: hideBackButton, sideBorders: sideBorders }));
    }
    return null;
};
ListMaybePlaceholder = memo(ListMaybePlaceholder);
export { ListMaybePlaceholder };
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
