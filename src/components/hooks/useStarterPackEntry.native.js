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
import { createStarterPackLinkFromAndroidReferrer, httpStarterPackUriToAtUri, } from '#/lib/strings/starter-pack';
import { useHasCheckedForStarterPack } from '#/state/preferences/used-starter-packs';
import { useSetActiveStarterPack } from '#/state/shell/starter-pack';
import { IS_ANDROID } from '#/env';
import { Referrer, SharedPrefs } from '../../../modules/expo-bluesky-swiss-army';
export function useStarterPackEntry() {
    var _this = this;
    var _a = React.useState(false), ready = _a[0], setReady = _a[1];
    var setActiveStarterPack = useSetActiveStarterPack();
    var hasCheckedForStarterPack = useHasCheckedForStarterPack();
    React.useEffect(function () {
        if (ready)
            return;
        // On Android, we cannot clear the referral link. It gets stored for 90 days and all we can do is query for it. So,
        // let's just ensure we never check again after the first time.
        if (hasCheckedForStarterPack) {
            setReady(true);
            return;
        }
        // Safety for Android. Very unlike this could happen, but just in case. The response should be nearly immediate
        var timeout = setTimeout(function () {
            setReady(true);
        }, 500);
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var uri, res, starterPackUri;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!IS_ANDROID) return [3 /*break*/, 2];
                        return [4 /*yield*/, Referrer.getGooglePlayReferrerInfoAsync()];
                    case 1:
                        res = _a.sent();
                        if (res && res.installReferrer) {
                            uri = createStarterPackLinkFromAndroidReferrer(res.installReferrer);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        starterPackUri = SharedPrefs.getString('starterPackUri');
                        if (starterPackUri) {
                            uri = httpStarterPackUriToAtUri(starterPackUri);
                            SharedPrefs.setValue('starterPackUri', null);
                        }
                        _a.label = 3;
                    case 3:
                        if (uri) {
                            setActiveStarterPack({
                                uri: uri,
                            });
                        }
                        setReady(true);
                        return [2 /*return*/];
                }
            });
        }); })();
        return function () {
            clearTimeout(timeout);
        };
    }, [ready, setActiveStarterPack, hasCheckedForStarterPack]);
    return ready;
}
