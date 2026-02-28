var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ActivityIndicator, FlatList as RNFlatList, RefreshControl, View, } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { usePalette } from '#/lib/hooks/usePalette';
import { cleanError } from '#/lib/strings/errors';
import { s } from '#/lib/styles';
import { logger } from '#/logger';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useMyListsQuery } from '#/state/queries/my-lists';
import { atoms as a, useTheme } from '#/alf';
import { BulletList_Stroke1_Corner0_Rounded as ListIcon } from '#/components/icons/BulletList';
import * as ListCard from '#/components/ListCard';
import { Text } from '#/components/Typography';
import { ErrorMessage } from '../util/error/ErrorMessage';
import { List } from '../util/List';
var LOADING = { _reactKey: '__loading__' };
var EMPTY = { _reactKey: '__empty__' };
var ERROR_ITEM = { _reactKey: '__error__' };
export function MyLists(_a) {
    var _this = this;
    var filter = _a.filter, inline = _a.inline, style = _a.style, renderItem = _a.renderItem, testID = _a.testID;
    var pal = usePalette('default');
    var t = useTheme();
    var _ = useLingui()._;
    var moderationOpts = useModerationOpts();
    var _b = React.useState(false), isPTRing = _b[0], setIsPTRing = _b[1];
    var _c = useMyListsQuery(filter), data = _c.data, isFetching = _c.isFetching, isFetched = _c.isFetched, isError = _c.isError, error = _c.error, refetch = _c.refetch;
    var isEmpty = !isFetching && !(data === null || data === void 0 ? void 0 : data.length);
    var items = React.useMemo(function () {
        var items = [];
        if (isError && isEmpty) {
            items = items.concat([ERROR_ITEM]);
        }
        if ((!isFetched && isFetching) || !moderationOpts) {
            items = items.concat([LOADING]);
        }
        else if (isEmpty) {
            items = items.concat([EMPTY]);
        }
        else {
            items = items.concat(data);
        }
        return items;
    }, [isError, isEmpty, isFetched, isFetching, moderationOpts, data]);
    var emptyText;
    switch (filter) {
        case 'curate':
            emptyText = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Lists allow you to see content from your favorite people."], ["Lists allow you to see content from your favorite people."]))));
            break;
        case 'mod':
            emptyText = _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Public, sharable lists of users to mute or block in bulk."], ["Public, sharable lists of users to mute or block in bulk."]))));
            break;
        default:
            emptyText = _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You have no lists."], ["You have no lists."]))));
            break;
    }
    // events
    // =
    var onRefresh = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsPTRing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, refetch()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    logger.error('Failed to refresh lists', { message: err_1 });
                    return [3 /*break*/, 4];
                case 4:
                    setIsPTRing(false);
                    return [2 /*return*/];
            }
        });
    }); }, [refetch, setIsPTRing]);
    // rendering
    // =
    var renderItemInner = React.useCallback(function (_a) {
        var item = _a.item, index = _a.index;
        if (item === EMPTY) {
            return (_jsxs(View, { style: [a.flex_1, a.align_center, a.gap_sm, a.px_xl, a.pt_3xl], children: [_jsx(View, { style: [
                            a.align_center,
                            a.justify_center,
                            a.rounded_full,
                            {
                                width: 64,
                                height: 64,
                            },
                        ], children: _jsx(ListIcon, { size: "2xl", fill: t.atoms.text_contrast_medium.color }) }), _jsx(Text, { style: [
                            a.text_center,
                            a.flex_1,
                            a.text_sm,
                            a.leading_snug,
                            t.atoms.text_contrast_medium,
                            {
                                maxWidth: 200,
                            },
                        ], children: emptyText })] }));
        }
        else if (item === ERROR_ITEM) {
            return (_jsx(ErrorMessage, { message: cleanError(error), onPressTryAgain: onRefresh }));
        }
        else if (item === LOADING) {
            return (_jsx(View, { style: { padding: 20 }, children: _jsx(ActivityIndicator, {}) }));
        }
        return renderItem ? (renderItem(item, index)) : (_jsx(View, { style: [
                index !== 0 && a.border_t,
                t.atoms.border_contrast_low,
                a.px_lg,
                a.py_lg,
            ], children: _jsx(ListCard.Default, { view: item }) }));
    }, [t, renderItem, error, onRefresh, emptyText]);
    if (inline) {
        return (_jsx(View, { testID: testID, style: style, children: items.length > 0 && (_jsx(RNFlatList, { testID: testID ? "".concat(testID, "-flatlist") : undefined, data: items, keyExtractor: function (item) { return (item.uri ? item.uri : item._reactKey); }, renderItem: renderItemInner, refreshControl: _jsx(RefreshControl, { refreshing: isPTRing, onRefresh: onRefresh, tintColor: pal.colors.text, titleColor: pal.colors.text }), contentContainerStyle: [s.contentContainer], removeClippedSubviews: true })) }));
    }
    else {
        return (_jsx(View, { testID: testID, style: style, children: items.length > 0 && (_jsx(List, { testID: testID ? "".concat(testID, "-flatlist") : undefined, data: items, keyExtractor: function (item) { return (item.uri ? item.uri : item._reactKey); }, renderItem: renderItemInner, refreshing: isPTRing, onRefresh: onRefresh, contentContainerStyle: [s.contentContainer], removeClippedSubviews: true, desktopFixedHeight: true, sideBorders: false })) }));
    }
}
var templateObject_1, templateObject_2, templateObject_3;
