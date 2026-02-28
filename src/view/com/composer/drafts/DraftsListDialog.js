var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo } from 'react';
import { Keyboard, View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useCallOnce } from '#/lib/once';
import { EmptyState } from '#/view/com/util/EmptyState';
import { atoms as a, select, useBreakpoints, useTheme, web } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { PageX_Stroke2_Corner0_Rounded_Large as PageXIcon } from '#/components/icons/PageX';
import { ListFooter } from '#/components/Lists';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { DraftItem } from './DraftItem';
import { useDeleteDraftMutation, useDraftsQuery } from './state/queries';
export function DraftsListDialog(_a) {
    var control = _a.control, onSelectDraft = _a.onSelectDraft;
    var _ = useLingui()._;
    var t = useTheme();
    var gtPhone = useBreakpoints().gtPhone;
    var ax = useAnalytics();
    var _b = useDraftsQuery(), data = _b.data, isLoading = _b.isLoading, hasNextPage = _b.hasNextPage, isFetchingNextPage = _b.isFetchingNextPage, fetchNextPage = _b.fetchNextPage;
    var deleteDraft = useDeleteDraftMutation().mutate;
    var drafts = useMemo(function () { var _a; return (_a = data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.drafts; })) !== null && _a !== void 0 ? _a : []; }, [data]);
    // Fire draft:listOpen metric when dialog opens and data is loaded
    var draftCount = drafts.length;
    var isDataReady = !isLoading && data !== undefined;
    var onDraftListOpen = useCallOnce();
    useEffect(function () {
        if (isDataReady) {
            onDraftListOpen(function () {
                ax.metric('draft:listOpen', {
                    draftCount: draftCount,
                });
            });
        }
    }, [onDraftListOpen, isDataReady, draftCount, ax]);
    var handleSelectDraft = useCallback(function (summary) {
        // Dismiss keyboard immediately to prevent flicker. Without this,
        // the text input regains focus (showing the keyboard) after the
        // drafts sheet closes, then loses it again when the post component
        // remounts with the draft content, causing a show-hide-show cycle -sfn
        Keyboard.dismiss();
        control.close(function () {
            onSelectDraft(summary);
        });
    }, [control, onSelectDraft]);
    var handleDeleteDraft = useCallback(function (draftSummary) {
        // Fire draft:delete metric
        var draftAgeMs = Date.now() - new Date(draftSummary.createdAt).getTime();
        ax.metric('draft:delete', {
            logContext: 'DraftsList',
            draftAgeMs: draftAgeMs,
        });
        deleteDraft({ draftId: draftSummary.id, draft: draftSummary.draft });
    }, [deleteDraft, ax]);
    var backButton = useCallback(function () { return (_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Back"], ["Back"])))), onPress: function () { return control.close(); }, size: "small", color: "primary", variant: "ghost", children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Back" }) }) })); }, [control, _]);
    var renderItem = useCallback(function (_a) {
        var item = _a.item;
        return (_jsx(View, { style: [gtPhone ? [a.px_md, a.pt_md] : [a.px_sm, a.pt_sm]], children: _jsx(DraftItem, { draft: item, onSelect: handleSelectDraft, onDelete: handleDeleteDraft }) }));
    }, [handleSelectDraft, handleDeleteDraft, gtPhone]);
    var header = useMemo(function () { return (_jsx(Dialog.Header, { renderLeft: backButton, children: _jsx(Dialog.HeaderText, { children: _jsx(Trans, { children: "Drafts" }) }) })); }, [backButton]);
    var onEndReached = useCallback(function () {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    var emptyComponent = useMemo(function () {
        if (isLoading) {
            return (_jsx(View, { style: [a.py_xl, a.align_center], children: _jsx(Loader, { size: "lg" }) }));
        }
        return (_jsx(EmptyState, { icon: PageXIcon, message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["No drafts yet"], ["No drafts yet"])))), style: [a.justify_center, { minHeight: 500 }] }));
    }, [isLoading, _]);
    var footerComponent = useMemo(function () { return (_jsxs(_Fragment, { children: [drafts.length > 5 && (_jsx(View, { style: [a.align_center, a.py_2xl], children: _jsx(Text, { style: [a.text_center, t.atoms.text_contrast_medium], children: _jsx(Trans, { children: "So many thoughts, you should post one" }) }) })), _jsx(ListFooter, { isFetchingNextPage: isFetchingNextPage, hasNextPage: hasNextPage, style: [a.border_transparent] })] })); }, [isFetchingNextPage, hasNextPage, drafts.length, t]);
    return (_jsxs(Dialog.Outer, { control: control, children: [IS_NATIVE && header, _jsx(Dialog.InnerFlatList, { data: drafts, renderItem: renderItem, keyExtractor: function (item) { return item.id; }, ListHeaderComponent: web(header), stickyHeaderIndices: web([0]), ListEmptyComponent: emptyComponent, ListFooterComponent: footerComponent, onEndReached: onEndReached, onEndReachedThreshold: 0.5, style: [
                    a.px_0,
                    web({ minHeight: 500 }),
                    {
                        backgroundColor: select(t.name, {
                            light: t.palette.contrast_50,
                            dark: t.palette.contrast_0,
                            dim: '#000000',
                        }),
                    },
                ], webInnerContentContainerStyle: [a.py_0], contentContainerStyle: [a.pb_xl] })] }));
}
var templateObject_1, templateObject_2;
