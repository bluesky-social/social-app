import React from 'react';
import { httpStarterPackUriToAtUri } from '#/lib/strings/starter-pack';
import { useSetActiveStarterPack } from '#/state/shell/starter-pack';
export function useStarterPackEntry() {
    var _a = React.useState(false), ready = _a[0], setReady = _a[1];
    var setActiveStarterPack = useSetActiveStarterPack();
    React.useEffect(function () {
        var href = window.location.href;
        var atUri = httpStarterPackUriToAtUri(href);
        if (atUri) {
            var url = new URL(href);
            // Determines if an App Clip is loading this landing page
            var isClip = url.searchParams.get('clip') === 'true';
            setActiveStarterPack({
                uri: atUri,
                isClip: isClip,
            });
        }
        setReady(true);
    }, [setActiveStarterPack]);
    return ready;
}
