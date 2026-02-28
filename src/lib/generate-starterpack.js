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
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useMutation } from '@tanstack/react-query';
import { until } from '#/lib/async/until';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
import { enforceLen } from '#/lib/strings/helpers';
import { useAgent } from '#/state/session';
export var createStarterPackList = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var list;
    var name = _b.name, description = _b.description, descriptionFacets = _b.descriptionFacets, profiles = _b.profiles, agent = _b.agent;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (profiles.length === 0)
                    throw new Error('No profiles given');
                return [4 /*yield*/, agent.app.bsky.graph.list.create({ repo: agent.session.did }, {
                        name: name,
                        description: description,
                        descriptionFacets: descriptionFacets,
                        avatar: undefined,
                        createdAt: new Date().toISOString(),
                        purpose: 'app.bsky.graph.defs#referencelist',
                    })];
            case 1:
                list = _c.sent();
                if (!list)
                    throw new Error('List creation failed');
                return [4 /*yield*/, agent.com.atproto.repo.applyWrites({
                        repo: agent.session.did,
                        writes: profiles.map(function (p) { return createListItem({ did: p.did, listUri: list.uri }); }),
                    })];
            case 2:
                _c.sent();
                return [2 /*return*/, list];
        }
    });
}); };
export function useGenerateStarterPackMutation(_a) {
    var _this = this;
    var onSuccess = _a.onSuccess, onError = _a.onError;
    var _ = useLingui()._;
    var agent = useAgent();
    return useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var profile, profiles, displayName, starterPackName, list;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, agent.app.bsky.actor.getProfile({
                                                actor: agent.session.did,
                                            })];
                                        case 1:
                                            profile = (_a.sent()).data;
                                            return [2 /*return*/];
                                    }
                                });
                            }); })(),
                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, agent.app.bsky.actor.searchActors({
                                                q: encodeURIComponent('*'),
                                                limit: 49,
                                            })];
                                        case 1:
                                            profiles = (_a.sent()).data.actors.filter(function (p) { var _a; return (_a = p.viewer) === null || _a === void 0 ? void 0 : _a.following; });
                                            return [2 /*return*/];
                                    }
                                });
                            }); })(),
                        ])];
                    case 1:
                        _a.sent();
                        if (!profile || !profiles) {
                            throw new Error('ERROR_DATA');
                        }
                        // We include ourselves when we make the list
                        if (profiles.length < 7) {
                            throw new Error('NOT_ENOUGH_FOLLOWERS');
                        }
                        displayName = enforceLen(profile.displayName
                            ? sanitizeDisplayName(profile.displayName)
                            : "@".concat(sanitizeHandle(profile.handle)), 25, true);
                        starterPackName = _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", "'s Starter Pack"], ["", "'s Starter Pack"])), displayName));
                        return [4 /*yield*/, createStarterPackList({
                                name: starterPackName,
                                profiles: profiles,
                                agent: agent,
                            })];
                    case 2:
                        list = _a.sent();
                        return [4 /*yield*/, agent.app.bsky.graph.starterpack.create({
                                repo: agent.session.did,
                            }, {
                                name: starterPackName,
                                list: list.uri,
                                createdAt: new Date().toISOString(),
                            })];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, whenAppViewReady(agent, data.uri, function (v) {
                            return typeof (v === null || v === void 0 ? void 0 : v.data.starterPack.uri) === 'string';
                        })];
                    case 1:
                        _a.sent();
                        onSuccess(data);
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            onError(error);
        },
    });
}
function createListItem(_a) {
    var did = _a.did, listUri = _a.listUri;
    return {
        $type: 'com.atproto.repo.applyWrites#create',
        collection: 'app.bsky.graph.listitem',
        value: {
            $type: 'app.bsky.graph.listitem',
            subject: did,
            list: listUri,
            createdAt: new Date().toISOString(),
        },
    };
}
function whenAppViewReady(agent, uri, fn) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, until(5, // 5 tries
                    1e3, // 1s delay between tries
                    fn, function () { return agent.app.bsky.graph.getStarterPack({ starterPack: uri }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1;
