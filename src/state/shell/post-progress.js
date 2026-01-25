import React from 'react';
var PostProgressContext = React.createContext({
    progress: 0,
    status: 'idle',
});
PostProgressContext.displayName = 'PostProgressContext';
export function Provider() { }
export function usePostProgress() {
    return React.useContext(PostProgressContext);
}
