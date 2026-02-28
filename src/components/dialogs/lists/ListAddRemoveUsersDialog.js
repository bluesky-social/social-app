var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { cleanError } from '#/lib/strings/errors';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { getMembership, useDangerousListMembershipsQuery, useListMembershipAddMutation, useListMembershipRemoveMutation, } from '#/state/queries/list-memberships';
import * as Toast from '#/view/com/util/Toast';
import { atoms as a } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { SearchablePeopleList, } from '#/components/dialogs/SearchablePeopleList';
import { Loader } from '#/components/Loader';
import * as ProfileCard from '#/components/ProfileCard';
export function ListAddRemoveUsersDialog(_a) {
    var control = _a.control, list = _a.list, onChange = _a.onChange;
    return (_jsxs(Dialog.Outer, { control: control, testID: "listAddRemoveUsersDialog", children: [_jsx(Dialog.Handle, {}), _jsx(DialogInner, { list: list, onChange: onChange })] }));
}
function DialogInner(_a) {
    var list = _a.list, onChange = _a.onChange;
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var memberships = useDangerousListMembershipsQuery().data;
    var renderProfileCard = useCallback(function (item) {
        return (_jsx(UserResult, { profile: item.profile, onChange: onChange, memberships: memberships, list: list, moderationOpts: moderationOpts }));
    }, [onChange, memberships, list, moderationOpts]);
    return (_jsx(SearchablePeopleList, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Add people to list"], ["Add people to list"])))), renderProfileCard: renderProfileCard }));
}
function UserResult(_a) {
    var profile = _a.profile, list = _a.list, memberships = _a.memberships, onChange = _a.onChange, moderationOpts = _a.moderationOpts;
    var _ = useLingui()._;
    var membership = useMemo(function () { return getMembership(memberships, list.uri, profile.did); }, [memberships, list.uri, profile.did]);
    var _b = useListMembershipAddMutation({
        onSuccess: function () {
            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Added to list"], ["Added to list"])))));
            onChange === null || onChange === void 0 ? void 0 : onChange('add', profile);
        },
        onError: function (e) { return Toast.show(cleanError(e), 'xmark'); },
    }), listMembershipAdd = _b.mutate, isAddingPending = _b.isPending;
    var _c = useListMembershipRemoveMutation({
        onSuccess: function () {
            Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Removed from list"], ["Removed from list"])))));
            onChange === null || onChange === void 0 ? void 0 : onChange('remove', profile);
        },
        onError: function (e) { return Toast.show(cleanError(e), 'xmark'); },
    }), listMembershipRemove = _c.mutate, isRemovingPending = _c.isPending;
    var isMutating = isAddingPending || isRemovingPending;
    var onToggleMembership = useCallback(function () {
        if (typeof membership === 'undefined') {
            return;
        }
        if (membership === false) {
            listMembershipAdd({
                listUri: list.uri,
                actorDid: profile.did,
            });
        }
        else {
            listMembershipRemove({
                listUri: list.uri,
                actorDid: profile.did,
                membershipUri: membership,
            });
        }
    }, [list, profile, membership, listMembershipAdd, listMembershipRemove]);
    if (!moderationOpts)
        return null;
    return (_jsx(View, { style: [a.flex_1, a.py_sm, a.px_lg], children: _jsxs(ProfileCard.Header, { children: [_jsx(ProfileCard.Avatar, { profile: profile, moderationOpts: moderationOpts }), _jsxs(View, { style: [a.flex_1], children: [_jsx(ProfileCard.Name, { profile: profile, moderationOpts: moderationOpts }), _jsx(ProfileCard.Handle, { profile: profile })] }), membership !== undefined && (_jsx(Button, { label: membership === false
                        ? _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Add user to list"], ["Add user to list"]))))
                        : _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Remove user from list"], ["Remove user from list"])))), onPress: onToggleMembership, disabled: isMutating, size: "small", variant: "solid", color: "secondary", children: isMutating ? (_jsx(ButtonIcon, { icon: Loader })) : (_jsx(ButtonText, { children: membership === false ? (_jsx(Trans, { children: "Add" })) : (_jsx(Trans, { children: "Remove" })) })) }))] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
