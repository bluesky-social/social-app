import { jsx as _jsx } from "react/jsx-runtime";
import { CurrentConvoIdProvider } from '#/state/messages/current-convo-id';
import { MessagesEventBusProvider } from '#/state/messages/events';
import { ListConvosProvider } from '#/state/queries/messages/list-conversations';
import { MessageDraftsProvider } from './message-drafts';
export function MessagesProvider(_a) {
    var children = _a.children;
    return (_jsx(CurrentConvoIdProvider, { children: _jsx(MessageDraftsProvider, { children: _jsx(MessagesEventBusProvider, { children: _jsx(ListConvosProvider, { children: children }) }) }) }));
}
