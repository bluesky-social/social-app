var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { useSetMinimalShellMode } from '#/state/shell';
import { MyLists } from '#/view/com/lists/MyLists';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import * as Layout from '#/components/Layout';
export function ListsScreen(_a) {
    var _ = useLingui()._;
    var setMinimalShellMode = useSetMinimalShellMode();
    var navigation = useNavigation();
    var requireEmailVerification = useRequireEmailVerification();
    var createListDialogControl = useDialogControl();
    useFocusEffect(useCallback(function () {
        setMinimalShellMode(false);
    }, [setMinimalShellMode]));
    var onPressNewList = useCallback(function () {
        createListDialogControl.open();
    }, [createListDialogControl]);
    var wrappedOnPressNewList = requireEmailVerification(onPressNewList, {
        instructions: [
            _jsx(Trans, { children: "Before creating a list, you must first verify your email." }, "lists"),
        ],
    });
    var onCreateList = useCallback(function (uri) {
        try {
            var urip = new AtUri(uri);
            navigation.navigate('ProfileList', {
                name: urip.hostname,
                rkey: urip.rkey,
            });
        }
        catch (_a) { }
    }, [navigation]);
    return (_jsxs(Layout.Screen, { testID: "listsScreen", children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { align: "left", children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Lists" }) }) }), _jsxs(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["New list"], ["New list"])))), testID: "newUserListBtn", color: "secondary", size: "small", onPress: wrappedOnPressNewList, children: [_jsx(ButtonIcon, { icon: PlusIcon }), _jsx(ButtonText, { children: _jsx(Trans, { context: "action", children: "New" }) })] })] }), _jsx(MyLists, { filter: "curate", style: a.flex_grow }), _jsx(CreateOrEditListDialog, { purpose: "app.bsky.graph.defs#curatelist", control: createListDialogControl, onSave: onCreateList })] }));
}
var templateObject_1;
