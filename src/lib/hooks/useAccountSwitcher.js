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
import { useCallback, useState } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { logger } from '#/logger';
import { useSessionApi } from '#/state/session';
import { useLoggedOutViewControls } from '#/state/shell/logged-out';
import * as Toast from '#/view/com/util/Toast';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
export function useAccountSwitcher() {
    var _this = this;
    var ax = useAnalytics();
    var _a = useState(null), pendingDid = _a[0], setPendingDid = _a[1];
    var _ = useLingui()._;
    var resumeSession = useSessionApi().resumeSession;
    var requestSwitchToAccount = useLoggedOutViewControls().requestSwitchToAccount;
    var onPressSwitchAccount = useCallback(function (account, logContext) { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (pendingDid) {
                        // The session API isn't resilient to race conditions so let's just ignore this.
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    setPendingDid(account.did);
                    if (!account.accessJwt) return [3 /*break*/, 3];
                    if (IS_WEB) {
                        // We're switching accounts, which remounts the entire app.
                        // On mobile, this gets us Home, but on the web we also need reset the URL.
                        // We can't change the URL via a navigate() call because the navigator
                        // itself is about to unmount, and it calls pushState() too late.
                        // So we change the URL ourselves. The navigator will pick it up on remount.
                        history.pushState(null, '', '/');
                    }
                    return [4 /*yield*/, resumeSession(account, true)];
                case 2:
                    _a.sent();
                    ax.metric('account:loggedIn', { logContext: logContext, withPassword: false });
                    Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Signed in as @", ""], ["Signed in as @", ""])), account.handle)));
                    return [3 /*break*/, 4];
                case 3:
                    requestSwitchToAccount({ requestedAccount: account.did });
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Please sign in as @", ""], ["Please sign in as @", ""])), account.handle)), 'circle-exclamation');
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    e_1 = _a.sent();
                    logger.error("switch account: selectAccount failed", {
                        message: e_1.message,
                    });
                    requestSwitchToAccount({ requestedAccount: account.did });
                    Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Please sign in as @", ""], ["Please sign in as @", ""])), account.handle)), 'circle-exclamation');
                    return [3 /*break*/, 7];
                case 6:
                    setPendingDid(null);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [_, ax, resumeSession, requestSwitchToAccount, pendingDid]);
    return { onPressSwitchAccount: onPressSwitchAccount, pendingDid: pendingDid };
}
var templateObject_1, templateObject_2, templateObject_3;
