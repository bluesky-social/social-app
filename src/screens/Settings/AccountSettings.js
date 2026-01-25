var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useModalControls } from '#/state/modals';
import { useSession } from '#/state/session';
import * as SettingsList from '#/screens/Settings/components/SettingsList';
import { atoms as a, useTheme } from '#/alf';
import { AgeAssuranceAccountCard } from '#/components/ageAssurance/AgeAssuranceAccountCard';
import { useDialogControl } from '#/components/Dialog';
import { BirthDateSettingsDialog } from '#/components/dialogs/BirthDateSettings';
import { EmailDialogScreenID, useEmailDialogControl, } from '#/components/dialogs/EmailDialog';
import { At_Stroke2_Corner2_Rounded as AtIcon } from '#/components/icons/At';
import { BirthdayCake_Stroke2_Corner2_Rounded as BirthdayCakeIcon } from '#/components/icons/BirthdayCake';
import { Car_Stroke2_Corner2_Rounded as CarIcon } from '#/components/icons/Car';
import { Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon } from '#/components/icons/Envelope';
import { Freeze_Stroke2_Corner2_Rounded as FreezeIcon } from '#/components/icons/Freeze';
import { Lock_Stroke2_Corner2_Rounded as LockIcon } from '#/components/icons/Lock';
import { PencilLine_Stroke2_Corner2_Rounded as PencilIcon } from '#/components/icons/Pencil';
import { ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon } from '#/components/icons/Shield';
import { Trash_Stroke2_Corner2_Rounded } from '#/components/icons/Trash';
import * as Layout from '#/components/Layout';
import { ChangeHandleDialog } from './components/ChangeHandleDialog';
import { ChangePasswordDialog } from './components/ChangePasswordDialog';
import { DeactivateAccountDialog } from './components/DeactivateAccountDialog';
import { ExportCarDialog } from './components/ExportCarDialog';
export function AccountSettingsScreen(_a) {
    var t = useTheme();
    var _ = useLingui()._;
    var currentAccount = useSession().currentAccount;
    var openModal = useModalControls().openModal;
    var emailDialogControl = useEmailDialogControl();
    var birthdayControl = useDialogControl();
    var changeHandleControl = useDialogControl();
    var changePasswordControl = useDialogControl();
    var exportCarControl = useDialogControl();
    var deactivateAccountControl = useDialogControl();
    return (_jsxs(Layout.Screen, { children: [_jsxs(Layout.Header.Outer, { children: [_jsx(Layout.Header.BackButton, {}), _jsx(Layout.Header.Content, { children: _jsx(Layout.Header.TitleText, { children: _jsx(Trans, { children: "Account" }) }) }), _jsx(Layout.Header.Slot, {})] }), _jsx(Layout.Content, { children: _jsxs(SettingsList.Container, { children: [_jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: EnvelopeIcon }), _jsx(SettingsList.ItemText, { style: [a.flex_0], children: _jsx(Trans, { children: "Email" }) }), currentAccount && (_jsxs(_Fragment, { children: [_jsx(SettingsList.BadgeText, { style: [a.flex_1], children: currentAccount.email || _jsx(Trans, { children: "(no email)" }) }), currentAccount.emailConfirmed && (_jsx(ShieldIcon, { fill: t.palette.primary_500, size: "md" }))] }))] }), currentAccount && !currentAccount.emailConfirmed && (_jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Verify your email"], ["Verify your email"])))), onPress: function () {
                                return emailDialogControl.open({
                                    id: EmailDialogScreenID.Verify,
                                });
                            }, style: [
                                a.my_xs,
                                a.mx_lg,
                                a.rounded_md,
                                { backgroundColor: t.palette.primary_50 },
                            ], hoverStyle: [{ backgroundColor: t.palette.primary_100 }], contentContainerStyle: [a.rounded_md, a.px_lg], children: [_jsx(SettingsList.ItemIcon, { icon: ShieldIcon, color: t.palette.primary_500 }), _jsx(SettingsList.ItemText, { style: [{ color: t.palette.primary_500 }, a.font_semi_bold], children: _jsx(Trans, { children: "Verify your email" }) }), _jsx(SettingsList.Chevron, { color: t.palette.primary_500 })] })), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Update email"], ["Update email"])))), onPress: function () {
                                return emailDialogControl.open({
                                    id: EmailDialogScreenID.Update,
                                });
                            }, children: [_jsx(SettingsList.ItemIcon, { icon: PencilIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Update email" }) }), _jsx(SettingsList.Chevron, {})] }), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Password"], ["Password"])))), onPress: function () { return changePasswordControl.open(); }, children: [_jsx(SettingsList.ItemIcon, { icon: LockIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Password" }) }), _jsx(SettingsList.Chevron, {})] }), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Handle"], ["Handle"])))), accessibilityHint: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Opens change handle dialog"], ["Opens change handle dialog"])))), onPress: function () { return changeHandleControl.open(); }, children: [_jsx(SettingsList.ItemIcon, { icon: AtIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Handle" }) }), _jsx(SettingsList.Chevron, {})] }), _jsxs(SettingsList.Item, { children: [_jsx(SettingsList.ItemIcon, { icon: BirthdayCakeIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Birthday" }) }), _jsx(SettingsList.BadgeButton, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Edit"], ["Edit"])))), onPress: function () { return birthdayControl.open(); } })] }), _jsx(AgeAssuranceAccountCard, { style: [a.px_xl, a.pt_xs, a.pb_md] }), _jsx(SettingsList.Divider, {}), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Export my data"], ["Export my data"])))), onPress: function () { return exportCarControl.open(); }, children: [_jsx(SettingsList.ItemIcon, { icon: CarIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Export my data" }) }), _jsx(SettingsList.Chevron, {})] }), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Deactivate account"], ["Deactivate account"])))), onPress: function () { return deactivateAccountControl.open(); }, destructive: true, children: [_jsx(SettingsList.ItemIcon, { icon: FreezeIcon }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Deactivate account" }) }), _jsx(SettingsList.Chevron, {})] }), _jsxs(SettingsList.PressableItem, { label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Delete account"], ["Delete account"])))), onPress: function () { return openModal({ name: 'delete-account' }); }, destructive: true, children: [_jsx(SettingsList.ItemIcon, { icon: Trash_Stroke2_Corner2_Rounded }), _jsx(SettingsList.ItemText, { children: _jsx(Trans, { children: "Delete account" }) }), _jsx(SettingsList.Chevron, {})] })] }) }), _jsx(BirthDateSettingsDialog, { control: birthdayControl }), _jsx(ChangeHandleDialog, { control: changeHandleControl }), _jsx(ChangePasswordDialog, { control: changePasswordControl }), _jsx(ExportCarDialog, { control: exportCarControl }), _jsx(DeactivateAccountDialog, { control: deactivateAccountControl })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
