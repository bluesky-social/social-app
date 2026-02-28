import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { AppState } from 'react-native';
import { MessagesEventBus } from '#/state/messages/events/agent';
import { useAgent, useSession } from '#/state/session';
var MessagesEventBusContext = React.createContext(null);
MessagesEventBusContext.displayName = 'MessagesEventBusContext';
export function useMessagesEventBus() {
    var ctx = React.useContext(MessagesEventBusContext);
    if (!ctx) {
        throw new Error('useMessagesEventBus must be used within a MessagesEventBusProvider');
    }
    return ctx;
}
export function MessagesEventBusProvider(_a) {
    var children = _a.children;
    var currentAccount = useSession().currentAccount;
    if (!currentAccount) {
        return (_jsx(MessagesEventBusContext.Provider, { value: null, children: children }));
    }
    return (_jsx(MessagesEventBusProviderInner, { children: children }));
}
export function MessagesEventBusProviderInner(_a) {
    var children = _a.children;
    var agent = useAgent();
    var bus = React.useState(function () {
        return new MessagesEventBus({
            agent: agent,
        });
    })[0];
    React.useEffect(function () {
        bus.resume();
        return function () {
            bus.suspend();
        };
    }, [bus]);
    React.useEffect(function () {
        var handleAppStateChange = function (nextAppState) {
            if (nextAppState === 'active') {
                bus.resume();
            }
            else {
                bus.background();
            }
        };
        var sub = AppState.addEventListener('change', handleAppStateChange);
        return function () {
            sub.remove();
        };
    }, [bus]);
    return (_jsx(MessagesEventBusContext.Provider, { value: bus, children: children }));
}
