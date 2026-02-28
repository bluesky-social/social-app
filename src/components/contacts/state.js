var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { createContext, useContext, useReducer } from 'react';
function reducer(state, action) {
    switch (action.type) {
        case 'SUBMIT_PHONE_NUMBER': {
            assertCurrentStep(state, '1: phone input');
            return __assign(__assign({ step: '2: verify number' }, action.payload), { lastSentAt: null });
        }
        case 'RESEND_VERIFICATION_CODE': {
            assertCurrentStep(state, '2: verify number');
            return __assign(__assign({}, state), { lastSentAt: new Date() });
        }
        case 'VERIFY_PHONE_NUMBER_SUCCESS': {
            assertCurrentStep(state, '2: verify number');
            return {
                step: '3: get contacts',
                token: action.payload.token,
                phoneCountryCode: state.phoneCountryCode,
                phoneNumber: state.phoneNumber,
            };
        }
        case 'BACK': {
            assertCurrentStep(state, '2: verify number');
            return {
                step: '1: phone input',
                phoneNumber: state.phoneNumber,
                phoneCountryCode: state.phoneCountryCode,
            };
        }
        case 'GET_CONTACTS_SUCCESS': {
            assertCurrentStep(state, '3: get contacts');
            return __assign(__assign({}, state), { contacts: action.payload.contacts });
        }
        case 'SYNC_CONTACTS_SUCCESS': {
            assertCurrentStep(state, '3: get contacts');
            return {
                step: '4: view matches',
                contacts: action.payload.contacts,
                matches: action.payload.matches,
                dismissedMatches: [],
            };
        }
        case 'DISMISS_MATCH': {
            assertCurrentStep(state, '4: view matches');
            return __assign(__assign({}, state), { dismissedMatches: __spreadArray(__spreadArray([], new Set(state.dismissedMatches), true), [
                    action.payload.did,
                ], false) });
        }
        case 'DISMISS_MATCH_FAILED': {
            assertCurrentStep(state, '4: view matches');
            return __assign(__assign({}, state), { dismissedMatches: state.dismissedMatches.filter(function (did) { return did !== action.payload.did; }) });
        }
    }
}
var InvalidStateTransitionError = /** @class */ (function (_super) {
    __extends(InvalidStateTransitionError, _super);
    function InvalidStateTransitionError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'InvalidStateTransitionError';
        return _this;
    }
    return InvalidStateTransitionError;
}(Error));
function assertCurrentStep(state, step) {
    if (state.step !== step) {
        throw new InvalidStateTransitionError("Invalid state transition: expecting ".concat(step, ", got ").concat(state.step));
    }
}
export function useFindContactsFlowState(initialState) {
    if (initialState === void 0) { initialState = { step: '1: phone input' }; }
    return useReducer(reducer, initialState);
}
export var FindContactsGoBackContext = createContext(undefined);
export function useOnPressBackButton() {
    var goBack = useContext(FindContactsGoBackContext);
    if (!goBack) {
        return undefined;
    }
    return function (evt) {
        evt.preventDefault();
        goBack();
    };
}
