var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSession } from '#/state/session';
import { ListMembers } from '#/view/com/lists/ListMembers';
import { EmptyState } from '#/view/com/util/EmptyState';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';
import { atoms as a, useBreakpoints } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import { PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { IS_NATIVE } from '#/env';
export function AboutSection(_a) {
    var ref = _a.ref, list = _a.list, onPressAddUser = _a.onPressAddUser, headerHeight = _a.headerHeight, scrollElRef = _a.scrollElRef;
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var gtMobile = useBreakpoints().gtMobile;
    var _b = useState(false), isScrolledDown = _b[0], setIsScrolledDown = _b[1];
    var isOwner = list.creator.did === (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did);
    var onScrollToTop = useCallback(function () {
        var _a;
        (_a = scrollElRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
            animated: IS_NATIVE,
            offset: -headerHeight,
        });
    }, [scrollElRef, headerHeight]);
    useImperativeHandle(ref, function () { return ({
        scrollToTop: onScrollToTop,
    }); });
    var renderHeader = useCallback(function () {
        if (!isOwner) {
            return _jsx(View, {});
        }
        if (!gtMobile) {
            return (_jsx(View, { style: [a.px_sm, a.py_sm], children: _jsxs(Button, { testID: "addUserBtn", label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Add a user to this list"], ["Add a user to this list"])))), onPress: onPressAddUser, color: "primary", size: "small", variant: "outline", style: [a.py_md], children: [_jsx(ButtonIcon, { icon: PersonPlusIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Add people" }) })] }) }));
        }
        return (_jsx(View, { style: [a.px_lg, a.py_md, a.flex_row_reverse], children: _jsxs(Button, { testID: "addUserBtn", label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Add a user to this list"], ["Add a user to this list"])))), onPress: onPressAddUser, color: "primary", size: "small", variant: "ghost", style: [a.py_sm], children: [_jsx(ButtonIcon, { icon: PersonPlusIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Add people" }) })] }) }));
    }, [isOwner, _, onPressAddUser, gtMobile]);
    var renderEmptyState = useCallback(function () {
        return (_jsxs(View, { style: [a.gap_xl, a.align_center], children: [_jsx(EmptyState, { icon: ListIcon, message: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["This list is empty."], ["This list is empty."])))) }), isOwner && (_jsxs(Button, { testID: "emptyStateAddUserBtn", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Start adding people"], ["Start adding people"])))), onPress: onPressAddUser, color: "primary", size: "small", children: [_jsx(ButtonIcon, { icon: PersonPlusIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Start adding people!" }) })] }))] }));
    }, [_, isOwner, onPressAddUser]);
    return (_jsxs(View, { children: [_jsx(ListMembers, { testID: "listItems", list: list.uri, scrollElRef: scrollElRef, renderHeader: renderHeader, renderEmptyState: renderEmptyState, headerOffset: headerHeight, onScrolledDownChange: setIsScrolledDown }), isScrolledDown && (_jsx(LoadLatestBtn, { onPress: onScrollToTop, label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Scroll to top"], ["Scroll to top"])))), showIndicator: false }))] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
