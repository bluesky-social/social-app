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
import React from 'react';
import { RichText as RichTextAPI } from '@atproto/api';
import { useAgent } from '#/state/session';
export function useRichText(text) {
    var _a = React.useState(text), prevText = _a[0], setPrevText = _a[1];
    var _b = React.useState(function () { return new RichTextAPI({ text: text }); }), rawRT = _b[0], setRawRT = _b[1];
    var _c = React.useState(null), resolvedRT = _c[0], setResolvedRT = _c[1];
    var agent = useAgent();
    if (text !== prevText) {
        setPrevText(text);
        setRawRT(new RichTextAPI({ text: text }));
        setResolvedRT(null);
        // This will queue an immediate re-render
    }
    React.useEffect(function () {
        var ignore = false;
        function resolveRTFacets() {
            return __awaiter(this, void 0, void 0, function () {
                var resolvedRT;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            resolvedRT = new RichTextAPI({ text: text });
                            return [4 /*yield*/, resolvedRT.detectFacets(agent)];
                        case 1:
                            _a.sent();
                            if (!ignore) {
                                setResolvedRT(resolvedRT);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
        resolveRTFacets();
        return function () {
            ignore = true;
        };
    }, [text, agent]);
    var isResolving = resolvedRT === null;
    return [resolvedRT !== null && resolvedRT !== void 0 ? resolvedRT : rawRT, isResolving];
}
