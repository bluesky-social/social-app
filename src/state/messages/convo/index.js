import { jsx as _jsx } from "react/jsx-runtime";
import React, { useContext, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useAppState } from '#/lib/appState';
import { Convo } from '#/state/messages/convo/agent';
import { isConvoActive } from '#/state/messages/convo/util';
import { useMessagesEventBus } from '#/state/messages/events';
import { RQKEY as getConvoKey, useMarkAsReadMutation, } from '#/state/queries/messages/conversation';
import { RQKEY_ROOT as ListConvosQueryKeyRoot } from '#/state/queries/messages/list-conversations';
import { RQKEY as createProfileQueryKey } from '#/state/queries/profile';
import { useAgent } from '#/state/session';
export * from '#/state/messages/convo/util';
var ChatContext = React.createContext(null);
ChatContext.displayName = 'ChatContext';
export function useConvo() {
    var ctx = useContext(ChatContext);
    if (!ctx) {
        throw new Error('useConvo must be used within a ConvoProvider');
    }
    return ctx;
}
/**
 * This hook should only be used when the Convo is "active", meaning the chat
 * is loaded and ready to be used, or its in a suspended or background state,
 * and ready for resumption.
 */
export function useConvoActive() {
    var ctx = useContext(ChatContext);
    if (!ctx) {
        throw new Error('useConvo must be used within a ConvoProvider');
    }
    if (!isConvoActive(ctx)) {
        throw new Error("useConvoActive must only be rendered when the Convo is ready.");
    }
    return ctx;
}
export function ConvoProvider(_a) {
    var children = _a.children, convoId = _a.convoId;
    var queryClient = useQueryClient();
    var agent = useAgent();
    var events = useMessagesEventBus();
    var convo = useState(function () {
        var placeholder = queryClient.getQueryData(getConvoKey(convoId));
        return new Convo({
            convoId: convoId,
            agent: agent,
            events: events,
            placeholderData: placeholder ? { convo: placeholder } : undefined,
        });
    })[0];
    var service = useSyncExternalStore(convo.subscribe, convo.getSnapshot);
    var markAsRead = useMarkAsReadMutation().mutate;
    var appState = useAppState();
    var isActive = appState === 'active';
    useFocusEffect(React.useCallback(function () {
        if (isActive) {
            convo.resume();
            markAsRead({ convoId: convoId });
            return function () {
                convo.background();
                markAsRead({ convoId: convoId });
            };
        }
    }, [isActive, convo, convoId, markAsRead]));
    React.useEffect(function () {
        return convo.on(function (event) {
            switch (event.type) {
                case 'invalidate-block-state': {
                    for (var _i = 0, _a = event.accountDids; _i < _a.length; _i++) {
                        var did = _a[_i];
                        queryClient.invalidateQueries({
                            queryKey: createProfileQueryKey(did),
                        });
                    }
                    queryClient.invalidateQueries({
                        queryKey: [ListConvosQueryKeyRoot],
                    });
                }
            }
        });
    }, [convo, queryClient]);
    return _jsx(ChatContext.Provider, { value: service, children: children });
}
