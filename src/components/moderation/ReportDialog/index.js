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
import React from 'react';
import { Pressable, View } from 'react-native';
import { BSKY_LABELER_DID } from '@atproto/api';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { wait } from '#/lib/async/wait';
import { getLabelingServiceTitle } from '#/lib/moderation';
import { useCallOnce } from '#/lib/once';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useMyLabelersQuery } from '#/state/queries/preferences';
import { CharProgress } from '#/view/com/composer/char-progress/CharProgress';
import { UserAvatar } from '#/view/com/util/UserAvatar';
import { atoms as a, useGutters, useTheme } from '#/alf';
import * as Admonition from '#/components/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { useDelayedLoading } from '#/components/hooks/useDelayedLoading';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Retry } from '#/components/icons/ArrowRotate';
import { Check_Stroke2_Corner0_Rounded as CheckThin, CheckThick_Stroke2_Corner0_Rounded as Check, } from '#/components/icons/Check';
import { PaperPlane_Stroke2_Corner0_Rounded as PaperPlane } from '#/components/icons/PaperPlane';
import { SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRight } from '#/components/icons/SquareArrowTopRight';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { createStaticClick, InlineLinkText, Link } from '#/components/Link';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_NATIVE } from '#/env';
import { useSubmitReportMutation } from './action';
import { BSKY_LABELER_ONLY_REPORT_REASONS, BSKY_LABELER_ONLY_SUBJECT_TYPES, NEW_TO_OLD_REASONS_MAP, SUPPORT_PAGE, } from './const';
import { useCopyForSubject } from './copy';
import { initialState, reducer } from './state';
import { parseReportSubject } from './utils/parseReportSubject';
import { useReportOptions, } from './utils/useReportOptions';
export { useDialogControl as useReportDialogControl } from '#/components/Dialog';
export function useGlobalReportDialogControl() {
    return useGlobalDialogsControlContext().reportDialogControl;
}
export function GlobalReportDialog() {
    var _a = useGlobalReportDialogControl(), value = _a.value, control = _a.control;
    return _jsx(ReportDialog, { control: control, subject: value === null || value === void 0 ? void 0 : value.subject });
}
export function ReportDialog(props) {
    var ax = useAnalytics();
    var subject = React.useMemo(function () { return (props.subject ? parseReportSubject(props.subject) : undefined); }, [props.subject]);
    var onClose = React.useCallback(function () {
        ax.metric('reportDialog:close', {});
    }, [ax]);
    return (_jsxs(Dialog.Outer, { control: props.control, onClose: onClose, children: [_jsx(Dialog.Handle, {}), subject ? _jsx(Inner, __assign({}, props, { subject: subject })) : _jsx(Invalid, {})] }));
}
/**
 * This should only be shown if the dialog is configured incorrectly by a
 * developer, but nevertheless we should have a graceful fallback.
 */
function Invalid() {
    var _ = useLingui()._;
    return (_jsxs(Dialog.ScrollableInner, { label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Report dialog"], ["Report dialog"])))), children: [_jsx(Text, { style: [a.font_bold, a.text_xl, a.leading_snug, a.pb_xs], children: _jsx(Trans, { children: "Invalid report subject" }) }), _jsx(Text, { style: [a.text_md, a.leading_snug], children: _jsx(Trans, { children: "Something wasn't quite right with the data you're trying to report. Please contact support." }) }), _jsx(Dialog.Close, {})] }));
}
function Inner(props) {
    var _this = this;
    var _a, _b, _c;
    var ax = useAnalytics();
    var logger = ax.logger.useChild(ax.logger.Context.ReportDialog);
    var t = useTheme();
    var _ = useLingui()._;
    var ref = React.useRef(null);
    var _d = useMyLabelersQuery({ excludeNonConfigurableLabelers: true }), allLabelers = _d.data, isLabelerLoading = _d.isLoading, labelersLoadError = _d.error, refetchLabelers = _d.refetch;
    var isLoading = useDelayedLoading(500, isLabelerLoading);
    var copy = useCopyForSubject(props.subject);
    var _e = useReportOptions(), categories = _e.categories, getCategory = _e.getCategory;
    var _f = React.useReducer(reducer, initialState), state = _f[0], dispatch = _f[1];
    /**
     * Submission handling
     */
    var submitReport = useSubmitReportMutation().mutateAsync;
    var _g = React.useState(false), isPending = _g[0], setPending = _g[1];
    var _h = React.useState(false), isSuccess = _h[0], setSuccess = _h[1];
    // some reasons ONLY go to Bluesky
    var isBskyOnlyReason = ((_a = state === null || state === void 0 ? void 0 : state.selectedOption) === null || _a === void 0 ? void 0 : _a.reason)
        ? BSKY_LABELER_ONLY_REPORT_REASONS.has(state.selectedOption.reason)
        : false;
    // some subjects ONLY go to Bluesky
    var isBskyOnlySubject = BSKY_LABELER_ONLY_SUBJECT_TYPES.has(props.subject.type);
    /**
     * Labelers that support this `subject` and its NSID collection
     */
    var supportedLabelers = React.useMemo(function () {
        if (!allLabelers)
            return [];
        return allLabelers
            .filter(function (l) {
            var subjectTypes = l.subjectTypes;
            if (subjectTypes === undefined)
                return true;
            if (props.subject.type === 'account') {
                return subjectTypes.includes('account');
            }
            else if (props.subject.type === 'convoMessage') {
                return subjectTypes.includes('chat');
            }
            else {
                return subjectTypes.includes('record');
            }
        })
            .filter(function (l) {
            var collections = l.subjectCollections;
            if (collections === undefined)
                return true;
            // all chat collections accepted, since only Bluesky handles chats
            if (props.subject.type === 'convoMessage')
                return true;
            return collections.includes(props.subject.nsid);
        })
            .filter(function (l) {
            if (!state.selectedOption)
                return false;
            if (isBskyOnlyReason || isBskyOnlySubject) {
                return l.creator.did === BSKY_LABELER_DID;
            }
            var supportedReasonTypes = l.reasonTypes;
            if (supportedReasonTypes === undefined)
                return true;
            return (
            // supports new reason type
            supportedReasonTypes.includes(state.selectedOption.reason) ||
                // supports old reason type (backwards compat)
                supportedReasonTypes.includes(NEW_TO_OLD_REASONS_MAP[state.selectedOption.reason]));
        });
    }, [
        props,
        allLabelers,
        state.selectedOption,
        isBskyOnlyReason,
        isBskyOnlySubject,
    ]);
    var hasSupportedLabelers = !!supportedLabelers.length;
    var hasSingleSupportedLabeler = supportedLabelers.length === 1;
    /**
     * We skip the select labeler step if there's only one possible labeler, and
     * that labeler is Bluesky (which is the case for chat reports and certain
     * reason types). We'll use this below to adjust the indexing and skip the
     * step in the UI.
     */
    var isAlwaysBskyLabeler = hasSingleSupportedLabeler && (isBskyOnlyReason || isBskyOnlySubject);
    var onSubmit = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    dispatch({ type: 'clearError' });
                    logger.info('submitting');
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, 4, 5]);
                    setPending(true);
                    // wait at least 1s, make it feel substantial
                    return [4 /*yield*/, wait(1e3, submitReport({
                            subject: props.subject,
                            state: state,
                        }))];
                case 2:
                    // wait at least 1s, make it feel substantial
                    _e.sent();
                    setSuccess(true);
                    ax.metric('reportDialog:success', {
                        reason: (_b = (_a = state.selectedOption) === null || _a === void 0 ? void 0 : _a.reason) !== null && _b !== void 0 ? _b : '',
                        labeler: (_d = (_c = state.selectedLabeler) === null || _c === void 0 ? void 0 : _c.creator.handle) !== null && _d !== void 0 ? _d : '',
                        details: !!state.details,
                    });
                    // give time for user feedback
                    setTimeout(function () {
                        props.control.close(function () {
                            var _a;
                            (_a = props.onAfterSubmit) === null || _a === void 0 ? void 0 : _a.call(props);
                        });
                    }, 1e3);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _e.sent();
                    ax.metric('reportDialog:failure', {});
                    logger.error(e_1, {
                        source: 'ReportDialog',
                    });
                    dispatch({
                        type: 'setError',
                        error: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Something went wrong. Please try again."], ["Something went wrong. Please try again."])))),
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setPending(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [_, submitReport, state, dispatch, props, setPending, setSuccess]);
    useCallOnce(function () {
        ax.metric('reportDialog:open', {
            subjectType: props.subject.type,
        });
    })();
    return (_jsxs(Dialog.ScrollableInner, { testID: "report:dialog", label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Report dialog"], ["Report dialog"])))), ref: ref, style: [a.w_full, { maxWidth: 500 }], children: [_jsxs(View, { style: [a.gap_2xl, IS_NATIVE && a.pt_md], children: [_jsxs(StepOuter, { children: [_jsx(StepTitle, { index: 1, title: copy.subtitle, activeIndex1: state.activeStepIndex1 }), isLoading ? (_jsxs(View, { style: [a.gap_sm], children: [_jsx(OptionCardSkeleton, {}), _jsx(OptionCardSkeleton, {}), _jsx(OptionCardSkeleton, {}), _jsx(OptionCardSkeleton, {}), _jsx(OptionCardSkeleton, {}), _jsx(Pressable, { accessible: false })] })) : labelersLoadError || !allLabelers ? (_jsx(Admonition.Outer, { type: "error", children: _jsxs(Admonition.Row, { children: [_jsx(Admonition.Icon, {}), _jsx(Admonition.Content, { children: _jsx(Admonition.Text, { children: _jsx(Trans, { children: "Something went wrong, please try again" }) }) }), _jsxs(Admonition.Button, { color: "negative_subtle", label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Retry loading report options"], ["Retry loading report options"])))), onPress: function () { return refetchLabelers(); }, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Retry" }) }), _jsx(ButtonIcon, { icon: Retry })] })] }) })) : (_jsx(_Fragment, { children: state.selectedCategory ? (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(View, { style: [a.flex_1], children: _jsx(CategoryCard, { option: state.selectedCategory }) }), _jsx(Button, { testID: "report:clearCategory", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Change report category"], ["Change report category"])))), size: "tiny", variant: "solid", color: "secondary", shape: "round", onPress: function () {
                                                dispatch({ type: 'clearCategory' });
                                            }, children: _jsx(ButtonIcon, { icon: X }) })] })) : (_jsxs(View, { style: [a.gap_sm], children: [categories.map(function (o) { return (_jsx(CategoryCard, { option: o, onSelect: function () {
                                                dispatch({
                                                    type: 'selectCategory',
                                                    option: o,
                                                    otherOption: getCategory('other').options[0],
                                                });
                                            } }, o.key)); }), ['post', 'account'].includes(props.subject.type) && (_jsx(Link, { to: SUPPORT_PAGE, label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Need to report a copyright violation, legal request, or regulatory compliance issue?"], ["Need to report a copyright violation, legal request, or regulatory compliance issue?"])))), children: function (_a) {
                                                var hovered = _a.hovered, pressed = _a.pressed;
                                                return (_jsxs(View, { style: [
                                                        a.flex_row,
                                                        a.align_center,
                                                        a.w_full,
                                                        a.px_md,
                                                        a.py_sm,
                                                        a.rounded_sm,
                                                        a.border,
                                                        hovered || pressed
                                                            ? [t.atoms.border_contrast_high]
                                                            : [t.atoms.border_contrast_low],
                                                    ], children: [_jsx(Text, { style: [a.flex_1, a.italic, a.leading_snug], children: _jsx(Trans, { children: "Need to report a copyright violation, legal request, or regulatory compliance issue?" }) }), _jsx(SquareArrowTopRight, { size: "sm", fill: t.atoms.text.color })] }));
                                            } }))] })) }))] }), _jsxs(StepOuter, { children: [_jsx(StepTitle, { index: 2, title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Select a reason"], ["Select a reason"])))), activeIndex1: state.activeStepIndex1 }), state.selectedOption ? (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(View, { style: [a.flex_1], children: _jsx(OptionCard, { option: state.selectedOption }) }), _jsx(Button, { testID: "report:clearReportOption", label: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Change report reason"], ["Change report reason"])))), size: "tiny", variant: "solid", color: "secondary", shape: "round", onPress: function () {
                                            dispatch({ type: 'clearOption' });
                                        }, children: _jsx(ButtonIcon, { icon: X }) })] })) : state.selectedCategory ? (_jsx(View, { style: [a.gap_sm], children: getCategory(state.selectedCategory.key).options.map(function (o) { return (_jsx(OptionCard, { option: o, onSelect: function () {
                                        dispatch({ type: 'selectOption', option: o });
                                    } }, o.reason)); }) })) : null] }), isAlwaysBskyLabeler ? (_jsx(ActionOnce, { check: function () { return !state.selectedLabeler; }, callback: function () {
                            dispatch({
                                type: 'selectLabeler',
                                labeler: supportedLabelers[0],
                            });
                        } })) : (_jsxs(StepOuter, { children: [_jsx(StepTitle, { index: 3, title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Select moderation service"], ["Select moderation service"])))), activeIndex1: state.activeStepIndex1 }), state.activeStepIndex1 >= 3 && (_jsx(_Fragment, { children: state.selectedLabeler ? (_jsx(_Fragment, { children: hasSingleSupportedLabeler ? (_jsx(LabelerCard, { labeler: state.selectedLabeler })) : (_jsxs(View, { style: [a.flex_row, a.align_center, a.gap_md], children: [_jsx(View, { style: [a.flex_1], children: _jsx(LabelerCard, { labeler: state.selectedLabeler }) }), _jsx(Button, { label: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Change moderation service"], ["Change moderation service"])))), size: "tiny", variant: "solid", color: "secondary", shape: "round", onPress: function () {
                                                    dispatch({ type: 'clearLabeler' });
                                                }, children: _jsx(ButtonIcon, { icon: X }) })] })) })) : (_jsx(_Fragment, { children: hasSupportedLabelers ? (_jsx(View, { style: [a.gap_sm], children: hasSingleSupportedLabeler ? (_jsxs(_Fragment, { children: [_jsx(LabelerCard, { labeler: supportedLabelers[0] }), _jsx(ActionOnce, { check: function () { return !state.selectedLabeler; }, callback: function () {
                                                        dispatch({
                                                            type: 'selectLabeler',
                                                            labeler: supportedLabelers[0],
                                                        });
                                                    } })] })) : (_jsx(_Fragment, { children: supportedLabelers.map(function (l) { return (_jsx(LabelerCard, { labeler: l, onSelect: function () {
                                                    dispatch({ type: 'selectLabeler', labeler: l });
                                                } }, l.creator.did)); }) })) })) : (
                                    // should never happen in our app
                                    _jsx(Admonition.Admonition, { type: "warning", children: _jsx(Trans, { children: "Unfortunately, none of your subscribed labelers supports this report type." }) })) })) }))] })), _jsxs(StepOuter, { children: [_jsx(StepTitle, { index: isAlwaysBskyLabeler ? 3 : 4, title: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Submit report"], ["Submit report"])))), activeIndex1: isAlwaysBskyLabeler
                                    ? state.activeStepIndex1 - 1
                                    : state.activeStepIndex1 }), state.activeStepIndex1 === 4 && (_jsxs(_Fragment, { children: [_jsxs(View, { style: [a.pb_xs, a.gap_xs], children: [_jsxs(Text, { style: [a.leading_snug, a.pb_xs], children: [_jsxs(Trans, { children: ["Your report will be sent to", ' ', _jsx(Text, { style: [a.font_semi_bold, a.leading_snug], children: (_b = state.selectedLabeler) === null || _b === void 0 ? void 0 : _b.creator.displayName }), "."] }), ' ', !state.detailsOpen ? (_jsx(InlineLinkText, __assign({ label: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Add more details (optional)"], ["Add more details (optional)"])))) }, createStaticClick(function () {
                                                        dispatch({ type: 'showDetails' });
                                                    }), { children: _jsx(Trans, { children: "Add more details (optional)" }) }))) : null] }), state.detailsOpen && (_jsxs(View, { children: [_jsx(Dialog.Input, { testID: "report:details", multiline: true, value: state.details, onChangeText: function (details) {
                                                            dispatch({ type: 'setDetails', details: details });
                                                        }, label: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Additional details (limit 300 characters)"], ["Additional details (limit 300 characters)"])))), style: { paddingRight: 60 }, numberOfLines: 4 }), _jsx(View, { style: [
                                                            a.absolute,
                                                            a.flex_row,
                                                            a.align_center,
                                                            a.pr_md,
                                                            a.pb_sm,
                                                            {
                                                                bottom: 0,
                                                                right: 0,
                                                            },
                                                        ], children: _jsx(CharProgress, { count: ((_c = state.details) === null || _c === void 0 ? void 0 : _c.length) || 0 }) })] }))] }), _jsxs(Button, { testID: "report:submit", label: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Submit report"], ["Submit report"])))), size: "large", variant: "solid", color: "primary", disabled: isPending || isSuccess, onPress: onSubmit, children: [_jsx(ButtonText, { children: _jsx(Trans, { children: "Submit report" }) }), _jsx(ButtonIcon, { icon: isSuccess ? CheckThin : isPending ? Loader : PaperPlane })] }), state.error && (_jsx(Admonition.Admonition, { type: "error", children: state.error }))] }))] })] }), _jsx(Dialog.Close, {})] }));
}
function ActionOnce(_a) {
    var check = _a.check, callback = _a.callback;
    React.useEffect(function () {
        if (check()) {
            callback();
        }
    }, [check, callback]);
    return null;
}
function StepOuter(_a) {
    var children = _a.children;
    return _jsx(View, { style: [a.gap_md, a.w_full], children: children });
}
function StepTitle(_a) {
    var index = _a.index, title = _a.title, activeIndex1 = _a.activeIndex1;
    var t = useTheme();
    var active = activeIndex1 === index;
    var completed = activeIndex1 > index;
    return (_jsxs(View, { style: [a.flex_row, a.gap_sm, a.pr_3xl], children: [_jsx(View, { style: [
                    a.justify_center,
                    a.align_center,
                    a.rounded_full,
                    a.border,
                    {
                        width: 24,
                        height: 24,
                        backgroundColor: active
                            ? t.palette.primary_500
                            : completed
                                ? t.palette.primary_100
                                : t.atoms.bg_contrast_25.backgroundColor,
                        borderColor: active
                            ? t.palette.primary_500
                            : completed
                                ? t.palette.primary_400
                                : t.atoms.border_contrast_low.borderColor,
                    },
                ], children: completed ? (_jsx(Check, { width: 12 })) : (_jsx(Text, { style: [
                        a.font_bold,
                        a.text_center,
                        t.atoms.text,
                        {
                            color: active
                                ? 'white'
                                : completed
                                    ? t.palette.primary_700
                                    : t.atoms.text_contrast_medium.color,
                            fontVariant: ['tabular-nums'],
                            width: 24,
                            height: 24,
                            lineHeight: 24,
                        },
                    ], children: index })) }), _jsx(Text, { style: [
                    a.flex_1,
                    a.font_bold,
                    a.text_lg,
                    a.leading_snug,
                    active ? t.atoms.text : t.atoms.text_contrast_medium,
                    {
                        top: 1,
                    },
                ], children: title })] }));
}
function CategoryCard(_a) {
    var option = _a.option, onSelect = _a.onSelect;
    var t = useTheme();
    var _ = useLingui()._;
    var gutters = useGutters(['compact']);
    var onPress = React.useCallback(function () {
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(option);
    }, [onSelect, option]);
    return (_jsx(Button, { testID: "report:category:".concat(option.title), label: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Create report for ", ""], ["Create report for ", ""])), option.title)), onPress: onPress, disabled: !onSelect, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(View, { style: [
                    a.w_full,
                    gutters,
                    a.py_sm,
                    a.rounded_sm,
                    a.border,
                    t.atoms.bg_contrast_25,
                    hovered || pressed
                        ? [t.atoms.border_contrast_high]
                        : [t.atoms.border_contrast_low],
                ], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: option.title }), _jsx(Text, { style: [a.text_sm, , a.leading_snug, t.atoms.text_contrast_medium], children: option.description })] }));
        } }));
}
function OptionCard(_a) {
    var option = _a.option, onSelect = _a.onSelect;
    var t = useTheme();
    var _ = useLingui()._;
    var gutters = useGutters(['compact']);
    var onPress = React.useCallback(function () {
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(option);
    }, [onSelect, option]);
    return (_jsx(Button, { testID: "report:option:".concat(option.title), label: _(msg({
            message: "Create report for ".concat(option.title),
            comment: 'Accessibility label for button to create a moderation report for the selected option',
        })), onPress: onPress, disabled: !onSelect, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsx(View, { style: [
                    a.w_full,
                    gutters,
                    a.py_sm,
                    a.rounded_sm,
                    a.border,
                    t.atoms.bg_contrast_25,
                    hovered || pressed
                        ? [t.atoms.border_contrast_high]
                        : [t.atoms.border_contrast_low],
                ], children: _jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: option.title }) }));
        } }));
}
function OptionCardSkeleton() {
    var t = useTheme();
    return (_jsx(View, { style: [
            a.w_full,
            a.rounded_sm,
            a.border,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
            { height: 55 }, // magic, based on web
        ] }));
}
function LabelerCard(_a) {
    var labeler = _a.labeler, onSelect = _a.onSelect;
    var t = useTheme();
    var _ = useLingui()._;
    var onPress = React.useCallback(function () {
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(labeler);
    }, [onSelect, labeler]);
    var title = getLabelingServiceTitle({
        displayName: labeler.creator.displayName,
        handle: labeler.creator.handle,
    });
    return (_jsx(Button, { testID: "report:labeler:".concat(labeler.creator.handle), label: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Send report to ", ""], ["Send report to ", ""])), title)), onPress: onPress, disabled: !onSelect, children: function (_a) {
            var hovered = _a.hovered, pressed = _a.pressed;
            return (_jsxs(View, { style: [
                    a.w_full,
                    a.p_sm,
                    a.flex_row,
                    a.align_center,
                    a.gap_sm,
                    a.rounded_md,
                    a.border,
                    t.atoms.bg_contrast_25,
                    hovered || pressed
                        ? [t.atoms.border_contrast_high]
                        : [t.atoms.border_contrast_low],
                ], children: [_jsx(UserAvatar, { type: "labeler", size: 36, avatar: labeler.creator.avatar }), _jsxs(View, { style: [a.flex_1], children: [_jsx(Text, { style: [a.text_md, a.font_semi_bold, a.leading_snug], children: title }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_medium], children: _jsxs(Trans, { children: ["By ", sanitizeHandle(labeler.creator.handle, '@')] }) })] })] }));
        } }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;
