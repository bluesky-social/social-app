import { createContext, useContext } from 'react';
export var Context = createContext(null);
Context.displayName = 'ContextMenuContext';
export var MenuContext = createContext(null);
MenuContext.displayName = 'ContextMenuMenuContext';
export var ItemContext = createContext(null);
ItemContext.displayName = 'ContextMenuItemContext';
export function useContextMenuContext() {
    var context = useContext(Context);
    if (!context) {
        throw new Error('useContextMenuContext must be used within a Context.Provider');
    }
    return context;
}
export function useContextMenuMenuContext() {
    var context = useContext(MenuContext);
    if (!context) {
        throw new Error('useContextMenuMenuContext must be used within a Context.Provider');
    }
    return context;
}
export function useContextMenuItemContext() {
    var context = useContext(ItemContext);
    if (!context) {
        throw new Error('useContextMenuItemContext must be used within a Context.Provider');
    }
    return context;
}
