import React from 'react';
export var Context = React.createContext(null);
Context.displayName = 'ContextMenuContext';
export var MenuContext = React.createContext(null);
MenuContext.displayName = 'ContextMenuMenuContext';
export var ItemContext = React.createContext(null);
ItemContext.displayName = 'ContextMenuItemContext';
export function useContextMenuContext() {
    var context = React.useContext(Context);
    if (!context) {
        throw new Error('useContextMenuContext must be used within a Context.Provider');
    }
    return context;
}
export function useContextMenuMenuContext() {
    var context = React.useContext(MenuContext);
    if (!context) {
        throw new Error('useContextMenuMenuContext must be used within a Context.Provider');
    }
    return context;
}
export function useContextMenuItemContext() {
    var context = React.useContext(ItemContext);
    if (!context) {
        throw new Error('useContextMenuItemContext must be used within a Context.Provider');
    }
    return context;
}
