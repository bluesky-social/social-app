import React from 'react';
import { useLingui } from '@lingui/react';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useTickEveryMinute } from '#/state/shell';
export function TimeElapsed(_a) {
    var timestamp = _a.timestamp, children = _a.children, timeToString = _a.timeToString;
    var i18n = useLingui().i18n;
    var ago = useGetTimeAgo();
    var tick = useTickEveryMinute();
    var _b = React.useState(function () {
        return timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick);
    }), timeElapsed = _b[0], setTimeAgo = _b[1];
    var _c = React.useState(tick), prevTick = _c[0], setPrevTick = _c[1];
    if (prevTick !== tick) {
        setPrevTick(tick);
        setTimeAgo(timeToString ? timeToString(i18n, timestamp) : ago(timestamp, tick));
    }
    return children({ timeElapsed: timeElapsed });
}
