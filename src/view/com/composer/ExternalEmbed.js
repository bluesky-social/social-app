var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { cleanError } from '#/lib/strings/errors';
import { useResolveGifQuery, useResolveLinkQuery, } from '#/state/queries/resolve-link';
import { ExternalEmbedRemoveBtn } from '#/view/com/composer/ExternalEmbedRemoveBtn';
import { atoms as a, useTheme } from '#/alf';
import { Loader } from '#/components/Loader';
import { ExternalEmbed } from '#/components/Post/Embed/ExternalEmbed';
import { ModeratedFeedEmbed } from '#/components/Post/Embed/FeedEmbed';
import { ModeratedListEmbed } from '#/components/Post/Embed/ListEmbed';
import { Embed as StarterPackEmbed } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Typography';
export var ExternalEmbedGif = function (_a) {
    var onRemove = _a.onRemove, gif = _a.gif;
    var t = useTheme();
    var _b = useResolveGifQuery(gif), data = _b.data, error = _b.error;
    var linkInfo = React.useMemo(function () {
        var _a, _b, _c;
        return data && {
            title: (_a = data.title) !== null && _a !== void 0 ? _a : data.uri,
            uri: data.uri,
            description: (_b = data.description) !== null && _b !== void 0 ? _b : '',
            thumb: (_c = data.thumb) === null || _c === void 0 ? void 0 : _c.source.path,
        };
    }, [data]);
    var loadingStyle = {
        aspectRatio: gif.media_formats.gif.dims[0] / gif.media_formats.gif.dims[1],
        width: '100%',
    };
    return (_jsxs(View, { style: [a.overflow_hidden, t.atoms.border_contrast_medium], children: [linkInfo ? (_jsx(View, { style: { pointerEvents: 'auto' }, children: _jsx(ExternalEmbed, { link: linkInfo, hideAlt: true }) })) : error ? (_jsxs(Container, { style: [a.align_start, a.p_md, a.gap_xs], children: [_jsx(Text, { numberOfLines: 1, style: t.atoms.text_contrast_high, children: gif.url }), _jsx(Text, { numberOfLines: 2, style: [{ color: t.palette.negative_400 }], children: cleanError(error) })] })) : (_jsx(Container, { style: loadingStyle, children: _jsx(Loader, { size: "xl" }) })), _jsx(ExternalEmbedRemoveBtn, { onRemove: onRemove })] }));
};
export var ExternalEmbedLink = function (_a) {
    var uri = _a.uri, hasQuote = _a.hasQuote, onRemove = _a.onRemove;
    var t = useTheme();
    var _b = useResolveLinkQuery(uri), data = _b.data, error = _b.error;
    var linkComponent = React.useMemo(function () {
        var _a;
        if (data) {
            if (data.type === 'external') {
                return (_jsx(ExternalEmbed, { link: {
                        title: data.title || uri,
                        uri: uri,
                        description: data.description,
                        thumb: (_a = data.thumb) === null || _a === void 0 ? void 0 : _a.source.path,
                    }, hideAlt: true }));
            }
            else if (data.kind === 'feed') {
                return (_jsx(ModeratedFeedEmbed, { embed: {
                        type: 'feed',
                        view: __assign({ $type: 'app.bsky.feed.defs#generatorView' }, data.view),
                    } }));
            }
            else if (data.kind === 'list') {
                return (_jsx(ModeratedListEmbed, { embed: {
                        type: 'list',
                        view: __assign({ $type: 'app.bsky.graph.defs#listView' }, data.view),
                    } }));
            }
            else if (data.kind === 'starter-pack') {
                return _jsx(StarterPackEmbed, { starterPack: data.view });
            }
        }
    }, [data, uri]);
    if ((data === null || data === void 0 ? void 0 : data.type) === 'record' && hasQuote) {
        // This is not currently supported by the data model so don't preview it.
        return null;
    }
    return (_jsxs(View, { style: [a.mb_xl, a.overflow_hidden, t.atoms.border_contrast_medium], children: [linkComponent ? (_jsx(View, { style: { pointerEvents: 'none' }, children: linkComponent })) : error ? (_jsxs(Container, { style: [a.align_start, a.p_md, a.gap_xs], children: [_jsx(Text, { numberOfLines: 1, style: t.atoms.text_contrast_high, children: uri }), _jsx(Text, { numberOfLines: 2, style: [{ color: t.palette.negative_400 }], children: cleanError(error) })] })) : (_jsx(Container, { children: _jsx(Loader, { size: "xl" }) })), _jsx(ExternalEmbedRemoveBtn, { onRemove: onRemove })] }));
};
function Container(_a) {
    var style = _a.style, children = _a.children;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_sm,
            a.border,
            a.align_center,
            a.justify_center,
            a.py_5xl,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_medium,
            style,
        ], children: children }));
}
