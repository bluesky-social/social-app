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
import { BSKY_LABELER_DID, BskyAgent } from '@atproto/api';
import { IS_TEST_USER } from '#/lib/constants';
import { configureAdditionalModerationAuthorities } from './additional-moderation-authorities';
import { readLabelers } from './agent-config';
export function configureModerationForGuest() {
    // This global mutation is *only* OK because this code is only relevant for testing.
    // Don't add any other global behavior here!
    switchToBskyAppLabeler();
    configureAdditionalModerationAuthorities();
}
export function configureModerationForAccount(agent, account) {
    return __awaiter(this, void 0, void 0, function () {
        var labelerDids;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // This global mutation is *only* OK because this code is only relevant for testing.
                    // Don't add any other global behavior here!
                    switchToBskyAppLabeler();
                    if (!IS_TEST_USER(account.handle)) return [3 /*break*/, 2];
                    return [4 /*yield*/, trySwitchToTestAppLabeler(agent)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, readLabelers(account.did).catch(function (_) { })];
                case 3:
                    labelerDids = _a.sent();
                    if (labelerDids) {
                        agent.configureLabelersHeader(labelerDids.filter(function (did) { return did !== BSKY_LABELER_DID; }));
                    }
                    else {
                        // If there are no headers in the storage, we'll not send them on the initial requests.
                        // If we wanted to fix this, we could block on the preferences query here.
                    }
                    configureAdditionalModerationAuthorities();
                    return [2 /*return*/];
            }
        });
    });
}
function switchToBskyAppLabeler() {
    BskyAgent.configure({ appLabelers: [BSKY_LABELER_DID] });
}
function trySwitchToTestAppLabeler(agent) {
    return __awaiter(this, void 0, void 0, function () {
        var did;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, agent
                        .resolveHandle({ handle: 'mod-authority.test' })
                        .catch(function (_) { return undefined; })];
                case 1:
                    did = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.data.did;
                    if (did) {
                        console.warn('USING TEST ENV MODERATION');
                        BskyAgent.configure({ appLabelers: [did] });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
