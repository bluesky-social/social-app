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
import { OTHER_REPORT_REASONS } from '#/components/moderation/ReportDialog/const';
export var initialState = {
    selectedCategory: undefined,
    selectedOption: undefined,
    selectedLabeler: undefined,
    details: undefined,
    detailsOpen: false,
    activeStepIndex1: 1,
};
export function reducer(state, action) {
    var _a;
    switch (action.type) {
        case 'selectCategory':
            return __assign(__assign({}, state), { selectedCategory: action.option, activeStepIndex1: action.option.key === 'other' ? 3 : 2, selectedOption: action.option.key === 'other' ? action.otherOption : undefined });
        case 'clearCategory':
            return __assign(__assign({}, state), { selectedCategory: undefined, selectedOption: undefined, selectedLabeler: undefined, activeStepIndex1: 1, detailsOpen: false });
        case 'selectOption':
            return __assign(__assign({}, state), { selectedOption: action.option, activeStepIndex1: 3, detailsOpen: OTHER_REPORT_REASONS.has(action.option.reason) });
        case 'clearOption':
            return __assign(__assign({}, state), { selectedOption: undefined, selectedLabeler: undefined, activeStepIndex1: 2, detailsOpen: false });
        case 'selectLabeler':
            return __assign(__assign({}, state), { selectedLabeler: action.labeler, activeStepIndex1: 4, detailsOpen: state.selectedOption
                    ? OTHER_REPORT_REASONS.has((_a = state.selectedOption) === null || _a === void 0 ? void 0 : _a.reason)
                    : false });
        case 'clearLabeler':
            return __assign(__assign({}, state), { selectedLabeler: undefined, activeStepIndex1: 3 });
        case 'setDetails':
            return __assign(__assign({}, state), { details: action.details });
        case 'setError':
            return __assign(__assign({}, state), { error: action.error });
        case 'clearError':
            return __assign(__assign({}, state), { error: undefined });
        case 'showDetails':
            return __assign(__assign({}, state), { detailsOpen: true });
    }
}
