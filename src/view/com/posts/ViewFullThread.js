var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { AtUri } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { usePalette } from '#/lib/hooks/usePalette';
import { makeProfileLink } from '#/lib/routes/links';
import { useInteractionState } from '#/components/hooks/useInteractionState';
import { SubtleHover } from '#/components/SubtleHover';
import { Link } from '../util/Link';
import { Text } from '../util/text/Text';
export function ViewFullThread(_a) {
    var uri = _a.uri;
    var _b = useInteractionState(), hover = _b.state, onHoverIn = _b.onIn, onHoverOut = _b.onOut;
    var pal = usePalette('default');
    var itemHref = React.useMemo(function () {
        var urip = new AtUri(uri);
        return makeProfileLink({ did: urip.hostname, handle: '' }, 'post', urip.rkey);
    }, [uri]);
    var _ = useLingui()._;
    return (_jsxs(Link, { style: [styles.viewFullThread], href: itemHref, asAnchor: true, noFeedback: true, onPointerEnter: onHoverIn, onPointerLeave: onHoverOut, children: [_jsx(SubtleHover, { hover: hover, 
                // adjust position for visual alignment - the actual box has lots of top padding and not much bottom padding -sfn
                style: { top: 8, bottom: -5 } }), _jsx(View, { style: styles.viewFullThreadDots, children: _jsxs(Svg, { width: "4", height: "40", children: [_jsx(Line, { x1: "2", y1: "0", x2: "2", y2: "15", stroke: pal.colors.replyLine, strokeWidth: "2" }), _jsx(Circle, { cx: "2", cy: "22", r: "1.5", fill: pal.colors.replyLineDot }), _jsx(Circle, { cx: "2", cy: "28", r: "1.5", fill: pal.colors.replyLineDot }), _jsx(Circle, { cx: "2", cy: "34", r: "1.5", fill: pal.colors.replyLineDot })] }) }), _jsx(Text, { type: "md", style: [pal.link, { paddingTop: 18, paddingBottom: 4 }], children: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View full thread"], ["View full thread"])))) })] }));
}
var styles = StyleSheet.create({
    viewFullThread: {
        flexDirection: 'row',
        gap: 10,
        paddingLeft: 18,
    },
    viewFullThreadDots: {
        width: 42,
        alignItems: 'center',
    },
});
var templateObject_1;
