import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
export function createPortalGroup_INTERNAL() {
    var Context = React.createContext({
        outlet: null,
        append: function () { },
        remove: function () { },
    });
    Context.displayName = 'BottomSheetPortalContext';
    function Provider(props) {
        var map = React.useRef({});
        var _a = React.useState(null), outlet = _a[0], setOutlet = _a[1];
        var append = React.useCallback(function (id, component) {
            if (map.current[id])
                return;
            map.current[id] = _jsx(React.Fragment, { children: component }, id);
            setOutlet(_jsx(_Fragment, { children: Object.values(map.current) }));
        }, []);
        var remove = React.useCallback(function (id) {
            delete map.current[id];
            setOutlet(_jsx(_Fragment, { children: Object.values(map.current) }));
        }, []);
        var contextValue = React.useMemo(function () { return ({
            outlet: outlet,
            append: append,
            remove: remove,
        }); }, [outlet, append, remove]);
        return (_jsx(Context.Provider, { value: contextValue, children: props.children }));
    }
    function Outlet() {
        var ctx = React.useContext(Context);
        return ctx.outlet;
    }
    function Portal(_a) {
        var children = _a.children;
        var _b = React.useContext(Context), append = _b.append, remove = _b.remove;
        var id = React.useId();
        React.useEffect(function () {
            append(id, children);
            return function () { return remove(id); };
        }, [id, children, append, remove]);
        return null;
    }
    return { Provider: Provider, Outlet: Outlet, Portal: Portal };
}
