import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GetContacts } from './screens/GetContacts';
import { PhoneInput } from './screens/PhoneInput';
import { VerifyNumber } from './screens/VerifyNumber';
import { ViewMatches } from './screens/ViewMatches';
import { FindContactsGoBackContext } from './state';
export function FindContactsFlow(_a) {
    var state = _a.state, dispatch = _a.dispatch, onBack = _a.onBack, onCancel = _a.onCancel, _b = _a.context, context = _b === void 0 ? 'Standalone' : _b;
    return (_jsxs(FindContactsGoBackContext, { value: onBack, children: [state.step === '1: phone input' && (_jsx(PhoneInput, { state: state, dispatch: dispatch, context: context, onSkip: onCancel })), state.step === '2: verify number' && (_jsx(VerifyNumber, { state: state, dispatch: dispatch, context: context, onSkip: onCancel })), state.step === '3: get contacts' && (_jsx(GetContacts, { state: state, dispatch: dispatch, onCancel: onCancel, context: context })), state.step === '4: view matches' && (_jsx(ViewMatches, { state: state, dispatch: dispatch, context: context, onNext: onCancel }))] }));
}
