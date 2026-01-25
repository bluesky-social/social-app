import React from 'react';
export var Context = React.createContext(null);
Context.displayName = 'MenuContext';
export var ItemContext = React.createContext(null);
ItemContext.displayName = 'MenuItemContext';
export function useMenuContext() {
    var context = React.useContext(Context);
    if (!context) {
        throw new Error('useMenuContext must be used within a Context.Provider');
    }
    return context;
}
export function useMenuItemContext() {
    var context = React.useContext(ItemContext);
    if (!context) {
        throw new Error('useMenuItemContext must be used within a Context.Provider');
    }
    return context;
}
