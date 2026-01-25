var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { View } from 'react-native';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { atoms as a, useTheme } from '#/alf';
export function useValuePropText(step) {
    var _ = useLingui()._;
    return [
        {
            title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Free your feed"], ["Free your feed"])))),
            description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["No more doomscrolling junk-filled algorithms. Find feeds that work for you, not against you."], ["No more doomscrolling junk-filled algorithms. Find feeds that work for you, not against you."])))),
            alt: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["A collection of popular feeds you can find on Bluesky, including News, Booksky, Game Dev, Blacksky, and Fountain Pens"], ["A collection of popular feeds you can find on Bluesky, including News, Booksky, Game Dev, Blacksky, and Fountain Pens"])))),
        },
        {
            title: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Find your people"], ["Find your people"])))),
            description: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Ditch the trolls and clickbait. Find real people and conversations that matter to you."], ["Ditch the trolls and clickbait. Find real people and conversations that matter to you."])))),
            alt: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Your profile picture surrounded by concentric circles of other users' profile pictures"], ["Your profile picture surrounded by concentric circles of other users' profile pictures"])))),
        },
        {
            title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Forget the noise"], ["Forget the noise"])))),
            description: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["No ads, no invasive tracking, no engagement traps. Bluesky respects your time and attention."], ["No ads, no invasive tracking, no engagement traps. Bluesky respects your time and attention."])))),
            alt: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["An illustration of several Bluesky posts alongside repost, like, and comment icons"], ["An illustration of several Bluesky posts alongside repost, like, and comment icons"])))),
        },
    ][step];
}
export function Dot(_a) {
    var active = _a.active;
    var t = useTheme();
    return (_jsx(View, { style: [
            a.rounded_full,
            { width: 8, height: 8 },
            active
                ? { backgroundColor: t.palette.primary_500 }
                : t.atoms.bg_contrast_50,
        ] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
