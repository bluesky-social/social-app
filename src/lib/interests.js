var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useMemo } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export var interests = [
    'animals',
    'art',
    'books',
    'comedy',
    'comics',
    'culture',
    'dev',
    'education',
    'finance',
    'food',
    'gaming',
    'journalism',
    'movies',
    'music',
    'nature',
    'news',
    'pets',
    'photography',
    'politics',
    'science',
    'sports',
    'tech',
    'tv',
    'writers',
];
// most popular selected interests
export var popularInterests = [
    'art',
    'gaming',
    'sports',
    'comics',
    'music',
    'politics',
    'photography',
    'science',
    'news',
];
export function useInterestsDisplayNames() {
    var _ = useLingui()._;
    return useMemo(function () {
        return {
            // Keep this alphabetized
            animals: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Animals"], ["Animals"])))),
            art: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Art"], ["Art"])))),
            books: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Books"], ["Books"])))),
            comedy: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Comedy"], ["Comedy"])))),
            comics: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Comics"], ["Comics"])))),
            culture: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Culture"], ["Culture"])))),
            dev: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Software Dev"], ["Software Dev"])))),
            education: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Education"], ["Education"])))),
            finance: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Finance"], ["Finance"])))),
            food: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Food"], ["Food"])))),
            gaming: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Video Games"], ["Video Games"])))),
            journalism: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Journalism"], ["Journalism"])))),
            movies: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Movies"], ["Movies"])))),
            music: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Music"], ["Music"])))),
            nature: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Nature"], ["Nature"])))),
            news: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["News"], ["News"])))),
            pets: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Pets"], ["Pets"])))),
            photography: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Photography"], ["Photography"])))),
            politics: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Politics"], ["Politics"])))),
            science: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Science"], ["Science"])))),
            sports: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Sports"], ["Sports"])))),
            tech: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Tech"], ["Tech"])))),
            tv: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["TV"], ["TV"])))),
            writers: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Writers"], ["Writers"])))),
        };
    }, [_]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24;
