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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { msg, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useCleanError } from '#/lib/hooks/useCleanError';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useRequireAuth } from '#/state/session';
import { useTheme } from '#/alf';
import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as toast from '#/components/Toast';
import { useAnalytics } from '#/analytics';
import { PostControlButton, PostControlButtonIcon } from './PostControlButton';
export var BookmarkButton = memo(function BookmarkButton(_a) {
    var _this = this;
    var post = _a.post, big = _a.big, logContext = _a.logContext, hitSlop = _a.hitSlop;
    var t = useTheme();
    var ax = useAnalytics();
    var _ = useLingui()._;
    var bookmark = useBookmarkMutation().mutateAsync;
    var cleanError = useCleanError();
    var requireAuth = useRequireAuth();
    var feedDescriptor = useFeedFeedbackContext().feedDescriptor;
    var viewer = post.viewer;
    var isBookmarked = !!(viewer === null || viewer === void 0 ? void 0 : viewer.bookmarked);
    var undoLabel = _(msg({
        message: "Undo",
        context: "Button label to undo saving/removing a post from saved posts.",
    }));
    var save = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (_a) {
            var e_1, _b, raw, clean;
            var _c = _a === void 0 ? {} : _a, disableUndo = _c.disableUndo;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, bookmark({
                                action: 'create',
                                post: post,
                            })];
                    case 1:
                        _d.sent();
                        ax.metric('post:bookmark', {
                            uri: post.uri,
                            authorDid: post.author.did,
                            logContext: logContext,
                            feedDescriptor: feedDescriptor,
                        });
                        toast.show(_jsxs(toast.Outer, { children: [_jsx(toast.Icon, {}), _jsx(toast.Text, { children: _jsx(Trans, { children: "Post saved" }) }), !disableUndo && (_jsx(toast.Action, { label: undoLabel, onPress: function () { return remove({ disableUndo: true }); }, children: undoLabel }))] }), {
                            type: 'success',
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _d.sent();
                        _b = cleanError(e_1), raw = _b.raw, clean = _b.clean;
                        toast.show(clean || raw || e_1, {
                            type: 'error',
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    var remove = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (_a) {
            var e_2, _b, raw, clean;
            var _c = _a === void 0 ? {} : _a, disableUndo = _c.disableUndo;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, bookmark({
                                action: 'delete',
                                uri: post.uri,
                            })];
                    case 1:
                        _d.sent();
                        ax.metric('post:unbookmark', {
                            uri: post.uri,
                            authorDid: post.author.did,
                            logContext: logContext,
                            feedDescriptor: feedDescriptor,
                        });
                        toast.show(_jsxs(toast.Outer, { children: [_jsx(toast.Icon, { icon: TrashIcon }), _jsx(toast.Text, { children: _jsx(Trans, { children: "Removed from saved posts" }) }), !disableUndo && (_jsx(toast.Action, { label: undoLabel, onPress: function () { return save({ disableUndo: true }); }, children: undoLabel }))] }));
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _d.sent();
                        _b = cleanError(e_2), raw = _b.raw, clean = _b.clean;
                        toast.show(clean || raw || e_2, {
                            type: 'error',
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    var onHandlePress = function () {
        return requireAuth(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isBookmarked) return [3 /*break*/, 2];
                        return [4 /*yield*/, remove()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, save()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    return (_jsx(PostControlButton, { testID: "postBookmarkBtn", big: big, label: isBookmarked
            ? _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Remove from saved posts"], ["Remove from saved posts"]))))
            : _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Add to saved posts"], ["Add to saved posts"])))), onPress: onHandlePress, hitSlop: hitSlop, children: _jsx(PostControlButtonIcon, { fill: isBookmarked ? t.palette.primary_500 : undefined, icon: isBookmarked ? BookmarkFilled : Bookmark }) }));
});
var templateObject_1, templateObject_2;
