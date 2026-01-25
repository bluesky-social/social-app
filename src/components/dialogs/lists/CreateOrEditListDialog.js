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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { RichText as RichTextAPI } from '@atproto/api';
import { msg, Plural, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { cleanError } from '#/lib/strings/errors';
import { isOverMaxGraphemeCount } from '#/lib/strings/helpers';
import { richTextToString } from '#/lib/strings/rich-text-helpers';
import { shortenLinks, stripInvalidMentions } from '#/lib/strings/rich-text-manip';
import { logger } from '#/logger';
import { useListCreateMutation, useListMetadataMutation, } from '#/state/queries/list';
import { useAgent } from '#/state/session';
import { ErrorMessage } from '#/view/com/util/error/ErrorMessage';
import * as Toast from '#/view/com/util/Toast';
import { EditableUserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as TextField from '#/components/forms/TextField';
import { Loader } from '#/components/Loader';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Typography';
import { IS_WEB } from '#/env';
var DISPLAY_NAME_MAX_GRAPHEMES = 64;
var DESCRIPTION_MAX_GRAPHEMES = 300;
export function CreateOrEditListDialog(_a) {
    var control = _a.control, list = _a.list, purpose = _a.purpose, onSave = _a.onSave;
    var _ = useLingui()._;
    var cancelControl = Dialog.useDialogControl();
    var _b = useState(false), dirty = _b[0], setDirty = _b[1];
    var height = useWindowDimensions().height;
    // 'You might lose unsaved changes' warning
    useEffect(function () {
        if (IS_WEB && dirty) {
            var abortController_1 = new AbortController();
            var signal = abortController_1.signal;
            window.addEventListener('beforeunload', function (evt) { return evt.preventDefault(); }, {
                signal: signal,
            });
            return function () {
                abortController_1.abort();
            };
        }
    }, [dirty]);
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
        }, testID: "createOrEditListDialog", children: [_jsx(DialogInner, { list: list, purpose: purpose, onSave: onSave, setDirty: setDirty, onPressCancel: onPressCancel }), _jsx(Prompt.Basic, { control: cancelControl, title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Discard changes?"], ["Discard changes?"])))), description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Are you sure you want to discard your changes?"], ["Are you sure you want to discard your changes?"])))), onConfirm: function () { return control.close(); }, confirmButtonCta: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Discard"], ["Discard"])))), confirmButtonColor: "negative" })] }));
}
function DialogInner(_a) {
    var _this = this;
    var list = _a.list, purpose = _a.purpose, onSave = _a.onSave, setDirty = _a.setDirty, onPressCancel = _a.onPressCancel;
    var activePurpose = useMemo(function () {
        if (list === null || list === void 0 ? void 0 : list.purpose) {
            return list.purpose;
        }
        if (purpose) {
            return purpose;
        }
        return 'app.bsky.graph.defs#curatelist';
    }, [list, purpose]);
    var isCurateList = activePurpose === 'app.bsky.graph.defs#curatelist';
    var _ = useLingui()._;
    var t = useTheme();
    var agent = useAgent();
    var control = Dialog.useDialogContext();
    var _b = useListCreateMutation(), createListMutation = _b.mutateAsync, createListError = _b.error, isCreateListError = _b.isError, isCreatingList = _b.isPending;
    var _c = useListMetadataMutation(), updateListMutation = _c.mutateAsync, updateListError = _c.error, isUpdateListError = _c.isError, isUpdatingList = _c.isPending;
    var _d = useState(''), imageError = _d[0], setImageError = _d[1];
    var _e = useState(false), displayNameTooShort = _e[0], setDisplayNameTooShort = _e[1];
    var initialDisplayName = (list === null || list === void 0 ? void 0 : list.name) || '';
    var _f = useState(initialDisplayName), displayName = _f[0], setDisplayName = _f[1];
    var initialDescription = (list === null || list === void 0 ? void 0 : list.description) || '';
    var _g = useState(function () {
        var text = list === null || list === void 0 ? void 0 : list.description;
        var facets = list === null || list === void 0 ? void 0 : list.descriptionFacets;
        if (!text || !facets) {
            return new RichTextAPI({ text: text || '' });
        }
        // We want to be working with a blank state here, so let's get the
        // serialized version and turn it back into a RichText
        var serialized = richTextToString(new RichTextAPI({ text: text, facets: facets }), false);
        var richText = new RichTextAPI({ text: serialized });
        richText.detectFacetsWithoutResolution();
        return richText;
    }), descriptionRt = _g[0], setDescriptionRt = _g[1];
    var _h = useState(list === null || list === void 0 ? void 0 : list.avatar), listAvatar = _h[0], setListAvatar = _h[1];
    var _j = useState(), newListAvatar = _j[0], setNewListAvatar = _j[1];
    var dirty = displayName !== initialDisplayName ||
        descriptionRt.text !== initialDescription ||
        listAvatar !== (list === null || list === void 0 ? void 0 : list.avatar);
    useEffect(function () {
        setDirty(dirty);
    }, [dirty, setDirty]);
    var onSelectNewAvatar = useCallback(function (img) {
        setImageError('');
        if (img === null) {
            setNewListAvatar(null);
            setListAvatar(null);
            return;
        }
        try {
            setNewListAvatar(img);
            setListAvatar(img.path);
        }
        catch (e) {
            setImageError(cleanError(e));
        }
    }, [setNewListAvatar, setListAvatar, setImageError]);
    var onPressSave = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var richText, uri_1, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setImageError('');
                    setDisplayNameTooShort(false);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    if (displayName.length === 0) {
                        setDisplayNameTooShort(true);
                        return [2 /*return*/];
                    }
                    richText = new RichTextAPI({ text: descriptionRt.text.trimEnd() }, { cleanNewlines: true });
                    return [4 /*yield*/, richText.detectFacets(agent)];
                case 2:
                    _a.sent();
                    richText = shortenLinks(richText);
                    richText = stripInvalidMentions(richText);
                    if (!list) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateListMutation({
                            uri: list.uri,
                            name: displayName,
                            description: richText.text,
                            descriptionFacets: richText.facets,
                            avatar: newListAvatar,
                        })];
                case 3:
                    _a.sent();
                    Toast.show(isCurateList
                        ? _(msg({ message: 'User list updated', context: 'toast' }))
                        : _(msg({ message: 'Moderation list updated', context: 'toast' })));
                    control.close(function () { return onSave === null || onSave === void 0 ? void 0 : onSave(list.uri); });
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, createListMutation({
                        purpose: activePurpose,
                        name: displayName,
                        description: richText.text,
                        descriptionFacets: richText.facets,
                        avatar: newListAvatar,
                    })];
                case 5:
                    uri_1 = (_a.sent()).uri;
                    Toast.show(isCurateList
                        ? _(msg({ message: 'User list created', context: 'toast' }))
                        : _(msg({ message: 'Moderation list created', context: 'toast' })));
                    control.close(function () { return onSave === null || onSave === void 0 ? void 0 : onSave(uri_1); });
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    logger.error('Failed to create/edit list', { message: String(e_1) });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [
        list,
        createListMutation,
        updateListMutation,
        onSave,
        control,
        displayName,
        descriptionRt,
        newListAvatar,
        setImageError,
        activePurpose,
        isCurateList,
        agent,
        _,
    ]);
    var displayNameTooLong = isOverMaxGraphemeCount({
        text: displayName,
        maxCount: DISPLAY_NAME_MAX_GRAPHEMES,
    });
    var descriptionTooLong = isOverMaxGraphemeCount({
        text: descriptionRt,
        maxCount: DESCRIPTION_MAX_GRAPHEMES,
    });
    var cancelButton = useCallback(function () { return (_jsx(Button, { label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Cancel"], ["Cancel"])))), onPress: onPressCancel, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], testID: "editProfileCancelBtn", children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Cancel" }) }) })); }, [onPressCancel, _]);
    var saveButton = useCallback(function () { return (_jsxs(Button, { label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Save"], ["Save"])))), onPress: onPressSave, disabled: !dirty ||
            isCreatingList ||
            isUpdatingList ||
            displayNameTooLong ||
            descriptionTooLong, size: "small", color: "primary", variant: "ghost", style: [a.rounded_full], testID: "editProfileSaveBtn", children: [_jsx(ButtonText, { style: [a.text_md, !dirty && t.atoms.text_contrast_low], children: _jsx(Trans, { children: "Save" }) }), (isCreatingList || isUpdatingList) && _jsx(ButtonIcon, { icon: Loader })] })); }, [
        _,
        t,
        dirty,
        onPressSave,
        isCreatingList,
        isUpdatingList,
        displayNameTooLong,
        descriptionTooLong,
    ]);
    var onChangeDisplayName = useCallback(function (text) {
        setDisplayName(text);
        if (text.length > 0 && displayNameTooShort) {
            setDisplayNameTooShort(false);
        }
    }, [displayNameTooShort]);
    var onChangeDescription = useCallback(function (newText) {
        var richText = new RichTextAPI({ text: newText });
        richText.detectFacetsWithoutResolution();
        setDescriptionRt(richText);
    }, [setDescriptionRt]);
    var title = list
        ? isCurateList
            ? _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Edit user list"], ["Edit user list"]))))
            : _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Edit moderation list"], ["Edit moderation list"]))))
        : isCurateList
            ? _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Create user list"], ["Create user list"]))))
            : _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Create moderation list"], ["Create moderation list"]))));
    var displayNamePlaceholder = isCurateList
        ? _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["e.g. Great Posters"], ["e.g. Great Posters"]))))
        : _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["e.g. Spammers"], ["e.g. Spammers"]))));
    var descriptionPlaceholder = isCurateList
        ? _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["e.g. The posters who never miss."], ["e.g. The posters who never miss."]))))
        : _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["e.g. Users that repeatedly reply with ads."], ["e.g. Users that repeatedly reply with ads."]))));
    return (_jsxs(Dialog.ScrollableInner, { label: title, style: [a.overflow_hidden, web({ maxWidth: 500 })], contentContainerStyle: [a.px_0, a.pt_0], header: _jsx(Dialog.Header, { renderLeft: cancelButton, renderRight: saveButton, children: _jsx(Dialog.HeaderText, { children: title }) }), children: [isUpdateListError && (_jsx(ErrorMessage, { message: cleanError(updateListError) })), isCreateListError && (_jsx(ErrorMessage, { message: cleanError(createListError) })), imageError !== '' && _jsx(ErrorMessage, { message: imageError }), _jsxs(View, { style: [a.pt_xl, a.px_xl, a.gap_xl], children: [_jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "List avatar" }) }), _jsx(View, { style: [a.align_start], children: _jsx(EditableUserAvatar, { size: 80, avatar: listAvatar, onSelectNewAvatar: onSelectNewAvatar, type: "list" }) })] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "List name" }) }), _jsx(TextField.Root, { isInvalid: displayNameTooLong || displayNameTooShort, children: _jsx(Dialog.Input, { defaultValue: displayName, onChangeText: onChangeDisplayName, label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Name"], ["Name"])))), placeholder: displayNamePlaceholder, testID: "editListNameInput" }) }), (displayNameTooLong || displayNameTooShort) && (_jsx(Text, { style: [
                                    a.text_sm,
                                    a.mt_xs,
                                    a.font_bold,
                                    { color: t.palette.negative_400 },
                                ], children: displayNameTooLong ? (_jsxs(Trans, { children: ["List name is too long.", ' ', _jsx(Plural, { value: DISPLAY_NAME_MAX_GRAPHEMES, other: "The maximum number of characters is #." })] })) : displayNameTooShort ? (_jsx(Trans, { children: "List must have a name." })) : null }))] }), _jsxs(View, { children: [_jsx(TextField.LabelText, { children: _jsx(Trans, { children: "List description" }) }), _jsx(TextField.Root, { isInvalid: descriptionTooLong, children: _jsx(Dialog.Input, { defaultValue: descriptionRt.text, onChangeText: onChangeDescription, multiline: true, label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Description"], ["Description"])))), placeholder: descriptionPlaceholder, testID: "editListDescriptionInput" }) }), descriptionTooLong && (_jsx(Text, { style: [
                                    a.text_sm,
                                    a.mt_xs,
                                    a.font_bold,
                                    { color: t.palette.negative_400 },
                                ], children: _jsxs(Trans, { children: ["List description is too long.", ' ', _jsx(Plural, { value: DESCRIPTION_MAX_GRAPHEMES, other: "The maximum number of characters is #." })] }) }))] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15;
