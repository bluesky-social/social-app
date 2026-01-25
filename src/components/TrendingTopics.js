var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { PressableScale } from '#/lib/custom-animations/PressableScale';
import { atoms as a, native, useTheme } from '#/alf';
import { StarterPack as StarterPackIcon } from '#/components/icons/StarterPack';
import { Link as InternalLink } from '#/components/Link';
import { Text } from '#/components/Typography';
export function TrendingTopic(_a) {
    var raw = _a.topic, size = _a.size, style = _a.style, hovered = _a.hovered;
    var topic = useTopic(raw);
    var isSmall = size === 'small';
    var hasIcon = topic.type === 'starter-pack' && !isSmall;
    var iconSize = 20;
    return (_jsxs(View, { style: [
            a.flex_row,
            a.align_center,
            isSmall
                ? [
                    {
                        paddingVertical: 2,
                        paddingHorizontal: 4,
                    },
                ]
                : [a.py_xs, a.px_sm],
            hasIcon && { gap: 6 },
            style,
        ], children: [hasIcon && topic.type === 'starter-pack' && (_jsx(StarterPackIcon, { gradient: "sky", width: iconSize, style: { marginLeft: -3, marginVertical: -1 } })), _jsx(Text, { style: [
                    a.font_semi_bold,
                    a.leading_tight,
                    isSmall ? [a.text_sm] : [a.text_md, { paddingBottom: 1 }],
                    hovered && { textDecorationLine: 'underline' },
                ], numberOfLines: 1, children: topic.displayName })] }));
}
export function TrendingTopicSkeleton(_a) {
    var _b = _a.size, size = _b === void 0 ? 'large' : _b, _c = _a.index, index = _c === void 0 ? 0 : _c;
    var t = useTheme();
    var isSmall = size === 'small';
    return (_jsx(View, { style: [
            a.rounded_full,
            a.border,
            t.atoms.border_contrast_medium,
            t.atoms.bg_contrast_25,
            isSmall
                ? {
                    width: index % 2 === 0 ? 75 : 90,
                    height: 27,
                }
                : {
                    width: index % 2 === 0 ? 90 : 110,
                    height: 36,
                },
        ] }));
}
export function TrendingTopicLink(_a) {
    var raw = _a.topic, children = _a.children, rest = __rest(_a, ["topic", "children"]);
    var topic = useTopic(raw);
    return (_jsx(InternalLink, __assign({ label: topic.label, to: topic.url, PressableComponent: native(PressableScale) }, rest, { children: children })));
}
export function useTopic(raw) {
    var _ = useLingui()._;
    return React.useMemo(function () {
        var displayName = raw.topic, link = raw.link;
        if (link.startsWith('/search')) {
            return {
                type: 'topic',
                label: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Browse posts about ", ""], ["Browse posts about ", ""])), displayName)),
                displayName: displayName,
                uri: undefined,
                url: link,
            };
        }
        else if (link.startsWith('/hashtag')) {
            return {
                type: 'tag',
                label: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Browse posts tagged with ", ""], ["Browse posts tagged with ", ""])), displayName)),
                displayName: displayName,
                // displayName: displayName.replace(/^#/, ''),
                uri: undefined,
                url: link,
            };
        }
        else if (link.startsWith('/starter-pack')) {
            return {
                type: 'starter-pack',
                label: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Browse starter pack ", ""], ["Browse starter pack ", ""])), displayName)),
                displayName: displayName,
                uri: undefined,
                url: link,
            };
        }
        /*
        if (!link.startsWith('at://')) {
          // above logic
        } else {
          const urip = new AtUri(link)
          switch (urip.collection) {
            case 'app.bsky.actor.profile': {
              return {
                type: 'profile',
                label: _(msg`View ${displayName}'s profile`),
                displayName,
                uri: urip,
                url: makeProfileLink({did: urip.host, handle: urip.host}),
              }
            }
            case 'app.bsky.feed.generator': {
              return {
                type: 'feed',
                label: _(msg`Browse the ${displayName} feed`),
                displayName,
                uri: urip,
                url: feedUriToHref(link),
              }
            }
          }
        }
         */
        return {
            type: 'unknown',
            label: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Browse topic ", ""], ["Browse topic ", ""])), displayName)),
            displayName: displayName,
            uri: undefined,
            url: link,
        };
    }, [_, raw]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
