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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { useCurrentConvoId } from './current-convo-id';
var MessageDraftsContext = React.createContext(null);
MessageDraftsContext.displayName = 'MessageDraftsContext';
function useMessageDraftsContext() {
    var ctx = React.useContext(MessageDraftsContext);
    if (!ctx) {
        throw new Error('useMessageDrafts must be used within a MessageDraftsContext');
    }
    return ctx;
}
export function useMessageDraft() {
    var currentConvoId = useCurrentConvoId().currentConvoId;
    var _a = useMessageDraftsContext(), state = _a.state, dispatch = _a.dispatch;
    return useMemo(function () { return ({
        getDraft: function () { return (currentConvoId && state[currentConvoId]) || ''; },
        clearDraft: function () {
            if (currentConvoId) {
                dispatch({ type: 'clear', convoId: currentConvoId });
            }
        },
    }); }, [state, dispatch, currentConvoId]);
}
export function useSaveMessageDraft(message) {
    var currentConvoId = useCurrentConvoId().currentConvoId;
    var dispatch = useMessageDraftsContext().dispatch;
    var messageRef = useRef(message);
    messageRef.current = message;
    useEffect(function () {
        return function () {
            if (currentConvoId) {
                dispatch({
                    type: 'set',
                    convoId: currentConvoId,
                    draft: messageRef.current,
                });
            }
        };
    }, [currentConvoId, dispatch]);
}
function reducer(state, action) {
    var _a, _b;
    switch (action.type) {
        case 'set':
            return __assign(__assign({}, state), (_a = {}, _a[action.convoId] = action.draft, _a));
        case 'clear':
            return __assign(__assign({}, state), (_b = {}, _b[action.convoId] = '', _b));
        default:
            return state;
    }
}
export function MessageDraftsProvider(_a) {
    var children = _a.children;
    var _b = useReducer(reducer, {}), state = _b[0], dispatch = _b[1];
    var ctx = useMemo(function () {
        return { state: state, dispatch: dispatch };
    }, [state]);
    return (_jsx(MessageDraftsContext.Provider, { value: ctx, children: children }));
}
