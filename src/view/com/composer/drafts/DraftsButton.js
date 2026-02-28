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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { atoms as a } from '#/alf';
import { Button, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import { useAnalytics } from '#/analytics';
import { DraftsListDialog } from './DraftsListDialog';
import { useSaveDraftMutation } from './state/queries';
export function DraftsButton(_a) {
    var _this = this;
    var onSelectDraft = _a.onSelectDraft, onSaveDraft = _a.onSaveDraft, onDiscard = _a.onDiscard, isEmpty = _a.isEmpty, isDirty = _a.isDirty, isEditingDraft = _a.isEditingDraft, canSaveDraft = _a.canSaveDraft, textLength = _a.textLength;
    var _ = useLingui()._;
    var ax = useAnalytics();
    var draftsDialogControl = Dialog.useDialogControl();
    var savePromptControl = Prompt.usePromptControl();
    var isSaving = useSaveDraftMutation().isPending;
    var handlePress = function () {
        if (isEmpty || !isDirty) {
            // Composer is empty or has no unsaved changes, go directly to drafts list
            draftsDialogControl.open();
        }
        else {
            // Composer has unsaved changes, ask what to do
            savePromptControl.open();
        }
    };
    var handleSaveAndOpen = function () { return __awaiter(_this, void 0, void 0, function () {
        var success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onSaveDraft()];
                case 1:
                    success = (_a.sent()).success;
                    if (success) {
                        draftsDialogControl.open();
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDiscardAndOpen = function () {
        // Fire draft:discard metric before discarding
        ax.metric('draft:discard', {
            logContext: 'BeforeDraftsList',
            hadContent: !isEmpty,
            textLength: textLength,
        });
        onDiscard();
        draftsDialogControl.open();
    };
    return (_jsxs(_Fragment, { children: [_jsx(Button, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Drafts"], ["Drafts"])))), variant: "ghost", color: "primary", shape: "default", size: "small", style: [a.rounded_full, a.py_sm, a.px_md, a.mx_xs], disabled: isSaving, onPress: handlePress, children: _jsx(ButtonText, { style: [a.text_md], children: _jsx(Trans, { children: "Drafts" }) }) }), _jsx(DraftsListDialog, { control: draftsDialogControl, onSelectDraft: onSelectDraft }), _jsxs(Prompt.Outer, { control: savePromptControl, children: [_jsx(Prompt.Content, { children: _jsx(Prompt.TitleText, { children: canSaveDraft ? (isEditingDraft ? (_jsx(Trans, { children: "Save changes?" })) : (_jsx(Trans, { children: "Save draft?" }))) : (_jsx(Trans, { children: "Discard draft?" })) }) }), _jsx(Prompt.DescriptionText, { children: canSaveDraft ? (isEditingDraft ? (_jsx(Trans, { children: "You have unsaved changes. Would you like to save them before viewing your drafts?" })) : (_jsx(Trans, { children: "Would you like to save this as a draft before viewing your drafts?" }))) : (_jsx(Trans, { children: "You can only save drafts up to 1000 characters. Would you like to discard this post before viewing your drafts?" })) }), _jsxs(Prompt.Actions, { children: [canSaveDraft && (_jsx(Prompt.Action, { cta: isEditingDraft ? _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Save changes"], ["Save changes"])))) : _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Save draft"], ["Save draft"])))), onPress: handleSaveAndOpen, color: "primary" })), _jsx(Prompt.Action, { cta: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Discard"], ["Discard"])))), onPress: handleDiscardAndOpen, color: "negative_subtle" }), _jsx(Prompt.Cancel, { cta: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Keep editing"], ["Keep editing"])))) })] })] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
