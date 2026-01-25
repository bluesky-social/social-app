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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { urls } from '#/lib/constants';
import { cleanError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';
import { logger } from '#/logger';
import { useProfileUpdateMutation } from '#/state/queries/profile';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import * as Toast from '#/view/com/util/Toast';
import { EditableUserAvatar } from '#/view/com/util/UserAvatar';
import { UserBanner } from '#/view/com/util/UserBanner';
import { atoms as a, useTheme } from '#/alf';
import { Admonition } from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { useSimpleVerificationState } from '#/components/verification';
var DISPLAY_NAME_MAX_GRAPHEMES = 64;
var DESCRIPTION_MAX_GRAPHEMES = 256;
export function EditProfileDialog(_a) {
    var profile = _a.profile, control = _a.control, onUpdate = _a.onUpdate;
    var _ = useLingui()._;
    var cancelControl = Dialog.useDialogControl();
    var _b = useState(false), dirty = _b[0], setDirty = _b[1];
    var height = useWindowDimensions().height;
    var onPressCancel = useCallback(function () {
        if (dirty) {
            cancelControl.open();
        }
        else {
            control.close();
        }
    }, [dirty, control, cancelControl]);
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: {
            preventDismiss: dirty,
            minHeight: height,
        }, webOptions: {
            onBackgroundPress: function () {
                if (dirty) {
                    cancelControl.open();
                }
                else {
                    control.close();
                }
            },
        }, testID: "editProfileModal", children: [_jsx(DialogInner, { profile: profile, onUpdate: onUpdate, setDirty: setDirty, onPressCancel: onPressCancel }), _jsx(Prompt.Basic, { control: cancelControl, title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Discard changes?"], ["Discard changes?"])))), description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Are you sure you want to discard your changes?"], ["Are you sure you want to discard your changes?"])))), onConfirm: function () { return control.close(); }, confirmButtonCta: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Discard"], ["Discard"])))), confirmButtonColor: "negative" })] }));
}
function DialogInner(_a) {
    var _this = this;
    var profile = _a.profile, onUpdate = _a.onUpdate, setDirty = _a.setDirty, onPressCancel = _a.onPressCancel;
    var _ = useLingui()._;
    var t = useTheme();
    var control = Dialog.useDialogContext();
    var verification = useSimpleVerificationState({
        profile: profile,
    });
    var _b = useProfileUpdateMutation(), updateProfileMutation = _b.mutateAsync, updateProfileError = _b.error, isUpdateProfileError = _b.isError, isUpdatingProfile = _b.isPending;
    var _c = useState(''), imageError = _c[0], setImageError = _c[1];
    var initialDisplayName = profile.displayName || '';
    var _d = useState(initialDisplayName), displayName = _d[0], setDisplayName = _d[1];
    var initialDescription = profile.description || '';
    var _e = useState(initialDescription), description = _e[0], setDescription = _e[1];
    var _f = useState(profile.banner), userBanner = _f[0], setUserBanner = _f[1];
    var _g = useState(profile.avatar), userAvatar = _g[0], setUserAvatar = _g[1];
    var _h = useState(), newUserBanner = _h[0], setNewUserBanner = _h[1];
    var _j = useState(), newUserAvatar = _j[0], setNewUserAvatar = _j[1];
    var dirty = displayName !== initialDisplayName ||
        description !== initialDescription ||
        userAvatar !== profile.avatar ||
        userBanner !== profile.banner;
    useEffect(function () {
        setDirty(dirty);
    }, [dirty, setDirty]);
    var onSelectNewAvatar = useCallback(function (img) {
        setImageError('');
        if (img === null) {
            setNewUserAvatar(null);
            setUserAvatar(null);
            return;
        }
        try {
            setNewUserAvatar(img);
            setUserAvatar(img.path);
        }
        catch (e) {
            setImageError(cleanError(e));
        }
    }, [setNewUserAvatar, setUserAvatar, setImageError]);
    var onSelectNewBanner = useCallback(function (img) {
        setImageError('');
        if (!img) {
            setNewUserBanner(null);
            setUserBanner(null);
            return;
        }
        try {
            setNewUserBanner(img);
            setUserBanner(img.path);
        }
        catch (e) {
            setImageError(cleanError(e));
        }
    }, [setNewUserBanner, setUserBanner, setImageError]);
    var onPressSave = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setImageError('');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, updateProfileMutation({
                            profile: profile,
                            updates: {
                                displayName: displayName.trimEnd(),
                                description: description.trimEnd(),
                            },
                            newUserAvatar: newUserAvatar,
                            newUserBanner: newUserBanner,
                        })];
                case 2:
                    _a.sent();
                    control.close(function () { return onUpdate === null || onUpdate === void 0 ? void 0 : onUpdate(); });
                    Toast.show(_(msg({ message: 'Profile updated', context: 'toast' })));
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    logger.error('Failed to update user profile', { message: String(e_1) });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [
        updateProfileMutation,
        profile,
        onUpdate,
        control,
        displayName,
        description,
        newUserAvatar,
        newUserBanner,
        setImageError,
        _,
    ]);
    var displayNameTooLong = isOverMaxGraphemeCount({
        text: displayName,
        maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
    });
    var descriptionTooLong = isOverMaxGraphemeCount({
        text: description,
        maxCount: DESCRIPTION_MAX_GRAPHEMES,
    });
    var cancelButton = useCallback(function () { return (_jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: onPressCancel, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], testID: "editProfileCancelBtn", children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Cancel" }) }) })); }, [onPressCancel, _]);
    var saveButton = useCallback(function () { return (_jsxs(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Save"], ["Save"])))), onPress: onPressSave, disabled: !dirty ||
            isUpdatingProfile ||
            displayNameTooLong ||
            descriptionTooLong, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], testID: "editProfileSaveBtn", children: [_jsx(ButtonText, { style: [a.text_md, !dirty && t.atoms.text_contrast_low], children: _jsx(Trans, { children: "Save" }) }), isUpdatingProfile && _jsx(ButtonIcon, { icon: Loader })] })); }, [
        _,
        t,
        dirty,
        onPressSave,
        isUpdatingProfile,
        displayNameTooLong,
        descriptionTooLong,
    ]);
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Edit profile"], ["Edit profile"])))), style: [a.overflow_hidden], contentContainerStyle: [a.px_0, a.pt_0], header: _jsx(Dialog.Header, { renderLeft: cancelButton, renderRight: saveButton, children: _jsx(Dialog.HeaderText, { children: _jsx(Trans, { children: "Edit profile" }) }) }), children: [_jsxs(View, { style: [a.relative], children: [_jsx(UserBanner, { banner: userBanner, onSelectNewBanner: onSelectNewBanner }), _jsx(View, { style: [
                            a.absolute,
                            {
                                top: 80,
                                left: 20,
                                width: 84,
                                height: 84,
                                borderWidth: 2,
                                borderRadius: 42,
                                borderColor: t.atoms.bg.backgroundColor,
                            },
                        ], children: _jsx(EditableUserAvatar, { size: 80, avatar: userAvatar, onSelectNewAvatar: onSelectNewAvatar }) })] }), isUpdateProfileError && (_jsx(View, { style: [a.mt_xl], children: _jsx(ErrorMessage, { message: cleanError(updateProfileError) }) })), imageError !== '' && (_jsx(View, { style: [a.mt_xl], children: _jsx(ErrorMessage, { message: imageError }) })), _jsxs(View, { style: [a.mt_4xl, a.px_xl, a.gap_xl], children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Display name" }) }), _jsx(TextField.Root, { isInvalid: displayNameTooLong, children: _jsx(Dialog.Input, { defaultValue: displayName, onChangeText: setDisplayName, label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Display name"], ["Display name"])))), placeholder: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["e.g. Alice Lastname"], ["e.g. Alice Lastname"])))), testID: "editProfileDisplayNameInput" }) }), displayNameTooLong && (_jsx(Text, { style: [
                                    a.text_sm,
                                    a.mt_xs,
                                    a.font_semi_bold,
                                    { color: t.palette.negative_400 },
                                ], children: _jsx(Plural, { value: DISPLAY_NAME_MAX_GRAPHEMES, other: "Display name is too long. The maximum number of characters is #." }) }))] }), verification.isVerified &&
                        verification.role === 'default' &&
                        displayName !== initialDisplayName && (_jsx(Admonition, { type: "error", children: _jsxs(Trans, { children: ["You are verified. You will lose your verification status if you change your display name.", ' ', _jsx(InlineLinkText, { label: _(msg({
                                        message: "Learn more",
                                        context: "english-only-resource",
                                    })), to: urls.website.blog.initialVerificationAnnouncement, children: _jsx(Trans, { context: "english-only-resource", children: "Learn more." }) })] }) })), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "Description" }) }), _jsx(TextField.Root, { isInvalid: descriptionTooLong, children: _jsx(Dialog.Input, { defaultValue: description, onChangeText: setDescription, multiline: true, label: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Description"], ["Description"])))), placeholder: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Tell us a bit about yourself"], ["Tell us a bit about yourself"])))), testID: "editProfileDescriptionInput" }) }), descriptionTooLong && (_jsx(Text, { style: [
                                    a.text_sm,
                                    a.mt_xs,
                                    a.font_semi_bold,
                                    { color: t.palette.negative_400 },
                                ], children: _jsx(Plural, { value: DESCRIPTION_MAX_GRAPHEMES, other: "Description is too long. The maximum number of characters is #." }) }))] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
