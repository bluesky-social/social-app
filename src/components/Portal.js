import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, Fragment, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, } from 'react';
export function createPortalGroup() {
    var Context = createContext({
        outlet: null,
        append: function () { },
        remove: function () { },
    });
    Context.displayName = 'PortalContext';
    function Provider(props) {
        var map = useRef({});
        var _a = useState(null), outlet = _a[0], setOutlet = _a[1];
        var append = useCallback(function (id, component) {
            if (map.current[id])
                return;
            map.current[id] = _jsx(Fragment, { children: component }, id);
            setOutlet(_jsx(_Fragment, { children: Object.values(map.current) }));
        }, []);
        var remove = useCallback(function (id) {
            map.current[id] = null;
            setOutlet(_jsx(_Fragment, { children: Object.values(map.current) }));
        }, []);
        var contextValue = useMemo(function () { return ({
            outlet: outlet,
            append: append,
            remove: remove,
        }); }, [outlet, append, remove]);
        return (_jsx(Context.Provider, { value: contextValue, children: props.children }));
    }
    function Outlet() {
        var ctx = useContext(Context);
        return ctx.outlet;
    }
    function Portal(_a) {
        var children = _a.children;
        var _b = useContext(Context), append = _b.append, remove = _b.remove;
        var id = useId();
        useEffect(function () {
            append(id, children);
            return function () { return remove(id); };
        }, [id, children, append, remove]);
        return null;
    }
    return { Provider: Provider, Outlet: Outlet, Portal: Portal };
}
var DefaultPortal = createPortalGroup();
export var Provider = DefaultPortal.Provider;
export var Outlet = DefaultPortal.Outlet;
export var Portal = DefaultPortal.Portal;
