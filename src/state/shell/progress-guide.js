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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { ProgressGuideToast, } from '#/components/ProgressGuide/Toast';
import { useAnalytics } from '#/analytics';
import { usePreferencesQuery, useSetActiveProgressGuideMutation, } from '../queries/preferences';
export var ProgressGuideAction;
(function (ProgressGuideAction) {
    ProgressGuideAction["Like"] = "like";
    ProgressGuideAction["Follow"] = "follow";
})(ProgressGuideAction || (ProgressGuideAction = {}));
var ProgressGuideContext = React.createContext(undefined);
ProgressGuideContext.displayName = 'ProgressGuideContext';
var ProgressGuideControlContext = React.createContext({
    startProgressGuide: function (_guide) { },
    endProgressGuide: function () { },
    captureAction: function (_action, _count) {
        if (_count === void 0) { _count = 1; }
    },
});
ProgressGuideControlContext.displayName = 'ProgressGuideControlContext';
export function useProgressGuide(guide) {
    var ctx = React.useContext(ProgressGuideContext);
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.guide) === guide) {
        return ctx;
    }
    return undefined;
}
export function useProgressGuideControls() {
    return React.useContext(ProgressGuideControlContext);
}
export function Provider(_a) {
    var children = _a.children;
    var ax = useAnalytics();
    var _ = useLingui()._;
    var preferences = usePreferencesQuery().data;
    var _b = useSetActiveProgressGuideMutation(), mutateAsync = _b.mutateAsync, variables = _b.variables, isPending = _b.isPending;
    var activeProgressGuide = useMemo(function () {
        var _a;
        var rawProgressGuide = (isPending ? variables : (_a = preferences === null || preferences === void 0 ? void 0 : preferences.bskyAppState) === null || _a === void 0 ? void 0 : _a.activeProgressGuide);
        if (!rawProgressGuide)
            return undefined;
        // ensure the unspecced attributes have the correct types
        // clone then mutate
        var maybeWronglyTypedProgressGuide = __rest(rawProgressGuide, []);
        if ((maybeWronglyTypedProgressGuide === null || maybeWronglyTypedProgressGuide === void 0 ? void 0 : maybeWronglyTypedProgressGuide.guide) === 'like-10-and-follow-7') {
            maybeWronglyTypedProgressGuide.numLikes =
                Number(maybeWronglyTypedProgressGuide.numLikes) || 0;
            maybeWronglyTypedProgressGuide.numFollows =
                Number(maybeWronglyTypedProgressGuide.numFollows) || 0;
        }
        else if ((maybeWronglyTypedProgressGuide === null || maybeWronglyTypedProgressGuide === void 0 ? void 0 : maybeWronglyTypedProgressGuide.guide) === 'follow-10') {
            maybeWronglyTypedProgressGuide.numFollows =
                Number(maybeWronglyTypedProgressGuide.numFollows) || 0;
        }
        return maybeWronglyTypedProgressGuide;
    }, [isPending, variables, preferences]);
    var _c = React.useState(undefined), localGuideState = _c[0], setLocalGuideState = _c[1];
    if (activeProgressGuide && !localGuideState) {
        // hydrate from the server if needed
        setLocalGuideState(activeProgressGuide);
    }
    var firstLikeToastRef = React.useRef(null);
    var fifthLikeToastRef = React.useRef(null);
    var tenthLikeToastRef = React.useRef(null);
    var fifthFollowToastRef = React.useRef(null);
    var tenthFollowToastRef = React.useRef(null);
    var controls = React.useMemo(function () {
        return {
            startProgressGuide: function (guide) {
                if (guide === 'like-10-and-follow-7') {
                    var guideObj = {
                        guide: 'like-10-and-follow-7',
                        numLikes: 0,
                        numFollows: 0,
                        isComplete: false,
                    };
                    setLocalGuideState(guideObj);
                    mutateAsync(guideObj);
                }
                else if (guide === 'follow-10') {
                    var guideObj = {
                        guide: 'follow-10',
                        numFollows: 0,
                        isComplete: false,
                    };
                    setLocalGuideState(guideObj);
                    mutateAsync(guideObj);
                }
            },
            endProgressGuide: function () {
                setLocalGuideState(undefined);
                mutateAsync(undefined);
                ax.metric('progressGuide:hide', {});
            },
            captureAction: function (action, count) {
                var _a, _b, _c, _d, _e;
                if (count === void 0) { count = 1; }
                var guide = activeProgressGuide;
                if (!guide || (guide === null || guide === void 0 ? void 0 : guide.isComplete)) {
                    return;
                }
                if ((guide === null || guide === void 0 ? void 0 : guide.guide) === 'like-10-and-follow-7') {
                    if (action === ProgressGuideAction.Like) {
                        guide = __assign(__assign({}, guide), { numLikes: (Number(guide.numLikes) || 0) + count });
                        if (guide.numLikes === 1) {
                            (_a = firstLikeToastRef.current) === null || _a === void 0 ? void 0 : _a.open();
                        }
                        if (guide.numLikes === 5) {
                            (_b = fifthLikeToastRef.current) === null || _b === void 0 ? void 0 : _b.open();
                        }
                        if (guide.numLikes === 10) {
                            (_c = tenthLikeToastRef.current) === null || _c === void 0 ? void 0 : _c.open();
                        }
                    }
                    if (action === ProgressGuideAction.Follow) {
                        guide = __assign(__assign({}, guide), { numFollows: (Number(guide.numFollows) || 0) + count });
                    }
                    if (Number(guide.numLikes) >= 10 && Number(guide.numFollows) >= 7) {
                        guide = __assign(__assign({}, guide), { isComplete: true });
                    }
                }
                else if ((guide === null || guide === void 0 ? void 0 : guide.guide) === 'follow-10') {
                    if (action === ProgressGuideAction.Follow) {
                        guide = __assign(__assign({}, guide), { numFollows: (Number(guide.numFollows) || 0) + count });
                        if (guide.numFollows === 5) {
                            (_d = fifthFollowToastRef.current) === null || _d === void 0 ? void 0 : _d.open();
                        }
                        if (guide.numFollows === 10) {
                            (_e = tenthFollowToastRef.current) === null || _e === void 0 ? void 0 : _e.open();
                        }
                    }
                    if (Number(guide.numFollows) >= 10) {
                        guide = __assign(__assign({}, guide), { isComplete: true });
                    }
                }
                setLocalGuideState(guide);
                mutateAsync((guide === null || guide === void 0 ? void 0 : guide.isComplete) ? undefined : guide);
            },
        };
    }, [ax, activeProgressGuide, mutateAsync, setLocalGuideState]);
    return (_jsx(ProgressGuideContext.Provider, { value: localGuideState, children: _jsxs(ProgressGuideControlContext.Provider, { value: controls, children: [children, (localGuideState === null || localGuideState === void 0 ? void 0 : localGuideState.guide) === 'like-10-and-follow-7' && (_jsxs(_Fragment, { children: [_jsx(ProgressGuideToast, { ref: firstLikeToastRef, title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Your first like!"], ["Your first like!"])))), subtitle: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Like 10 posts to train the Discover feed"], ["Like 10 posts to train the Discover feed"])))) }), _jsx(ProgressGuideToast, { ref: fifthLikeToastRef, title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Half way there!"], ["Half way there!"])))), subtitle: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Like 10 posts to train the Discover feed"], ["Like 10 posts to train the Discover feed"])))) }), _jsx(ProgressGuideToast, { ref: tenthLikeToastRef, title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Task complete - 10 likes!"], ["Task complete - 10 likes!"])))), subtitle: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["The Discover feed now knows what you like"], ["The Discover feed now knows what you like"])))) }), _jsx(ProgressGuideToast, { ref: fifthFollowToastRef, title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Half way there!"], ["Half way there!"])))), subtitle: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Follow 10 accounts"], ["Follow 10 accounts"])))) }), _jsx(ProgressGuideToast, { ref: tenthFollowToastRef, title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Task complete - 10 follows!"], ["Task complete - 10 follows!"])))), subtitle: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["You've found some people to follow"], ["You've found some people to follow"])))) })] }))] }) }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;
