import { useEffect, useState } from 'react';
export function useTLDs() {
    var _a = useState(), tlds = _a[0], setTlds = _a[1];
    useEffect(function () {
        // @ts-expect-error - valid path
        import('tldts/dist/index.cjs.min.js').then(function (tlds) {
            setTlds(tlds);
        });
    }, []);
    return tlds;
}
