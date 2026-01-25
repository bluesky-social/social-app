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
import { ComAtprotoRepoPutRecord, } from '@atproto/api';
import { retry } from '@atproto/common-web';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadBlob } from '#/lib/api';
import { imageToThumb } from '#/lib/api/resolve';
import { getLinkMeta } from '#/lib/link-meta/link-meta';
import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { useLiveNowConfig } from '#/state/service-config';
import { useAgent, useSession } from '#/state/session';
import * as Toast from '#/view/com/util/Toast';
import { useDialogContext } from '#/components/Dialog';
import { getLiveServiceNames } from '#/components/live/utils';
import { useAnalytics } from '#/analytics';
export function useLiveLinkMetaQuery(url) {
    var _this = this;
    var liveNowConfig = useLiveNowConfig();
    var _ = useLingui()._;
    var agent = useAgent();
    return useQuery({
        enabled: !!url,
        queryKey: ['link-meta', url],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var urlp, formatted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!url)
                            return [2 /*return*/, undefined];
                        urlp = new URL(url);
                        if (!liveNowConfig.allowedDomains.has(urlp.hostname)) {
                            formatted = getLiveServiceNames(liveNowConfig.allowedDomains).formatted;
                            throw new Error(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["This service is not supported while the Live feature is in beta. Allowed services: ", "."], ["This service is not supported while the Live feature is in beta. Allowed services: ", "."])), formatted)));
                        }
                        return [4 /*yield*/, getLinkMeta(agent, url)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
    });
}
export function useUpsertLiveStatusMutation(duration, linkMeta, createdAt) {
    var _this = this;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var control = useDialogContext();
    var _ = useLingui()._;
    return useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var embed, thumb, img, blob, e_1, record, upsert;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!currentAccount)
                            throw new Error('Not logged in');
                        if (!linkMeta) return [3 /*break*/, 7];
                        thumb = void 0;
                        if (!linkMeta.image) return [3 /*break*/, 6];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, imageToThumb(linkMeta.image)];
                    case 2:
                        img = _c.sent();
                        if (!img) return [3 /*break*/, 4];
                        return [4 /*yield*/, uploadBlob(agent, img.source.path, img.source.mime)];
                    case 3:
                        blob = _c.sent();
                        thumb = blob.data.blob;
                        _c.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_1 = _c.sent();
                        ax.logger.error("Failed to upload thumbnail for live status", {
                            url: linkMeta.url,
                            image: linkMeta.image,
                            safeMessage: e_1,
                        });
                        return [3 /*break*/, 6];
                    case 6:
                        embed = {
                            $type: 'app.bsky.embed.external',
                            external: {
                                $type: 'app.bsky.embed.external#external',
                                title: (_a = linkMeta.title) !== null && _a !== void 0 ? _a : '',
                                description: (_b = linkMeta.description) !== null && _b !== void 0 ? _b : '',
                                uri: linkMeta.url,
                                thumb: thumb,
                            },
                        };
                        _c.label = 7;
                    case 7:
                        record = {
                            $type: 'app.bsky.actor.status',
                            createdAt: createdAt !== null && createdAt !== void 0 ? createdAt : new Date().toISOString(),
                            status: 'app.bsky.actor.status#live',
                            durationMinutes: duration,
                            embed: embed,
                        };
                        upsert = function () { return __awaiter(_this, void 0, void 0, function () {
                            var repo, collection, existing;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        repo = currentAccount.did;
                                        collection = 'app.bsky.actor.status';
                                        return [4 /*yield*/, agent.com.atproto.repo
                                                .getRecord({ repo: repo, collection: collection, rkey: 'self' })
                                                .catch(function (_e) { return undefined; })];
                                    case 1:
                                        existing = _a.sent();
                                        return [4 /*yield*/, agent.com.atproto.repo.putRecord({
                                                repo: repo,
                                                collection: collection,
                                                rkey: 'self',
                                                record: record,
                                                swapRecord: (existing === null || existing === void 0 ? void 0 : existing.data.cid) || null,
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, retry(upsert, {
                                maxRetries: 5,
                                retryable: function (e) { return e instanceof ComAtprotoRepoPutRecord.InvalidSwapError; },
                            })];
                    case 8:
                        _c.sent();
                        return [2 /*return*/, {
                                record: record,
                                image: linkMeta === null || linkMeta === void 0 ? void 0 : linkMeta.image,
                            }];
                }
            });
        }); },
        onError: function (e) {
            ax.logger.error("Failed to upsert live status", {
                url: linkMeta === null || linkMeta === void 0 ? void 0 : linkMeta.url,
                image: linkMeta === null || linkMeta === void 0 ? void 0 : linkMeta.image,
                safeMessage: e,
            });
        },
        onSuccess: function (_a) {
            var record = _a.record, image = _a.image;
            if (createdAt) {
                ax.metric('live:edit', { duration: record.durationMinutes });
            }
            else {
                ax.metric('live:create', { duration: record.durationMinutes });
            }
            Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You are now live!"], ["You are now live!"])))));
            control.close(function () {
                if (!currentAccount)
                    return;
                var expiresAt = new Date(record.createdAt);
                expiresAt.setMinutes(expiresAt.getMinutes() + record.durationMinutes);
                updateProfileShadow(queryClient, currentAccount.did, {
                    status: {
                        $type: 'app.bsky.actor.defs#statusView',
                        status: 'app.bsky.actor.status#live',
                        isActive: true,
                        expiresAt: expiresAt.toISOString(),
                        embed: record.embed && image
                            ? {
                                $type: 'app.bsky.embed.external#view',
                                external: __assign(__assign({}, record.embed.external), { $type: 'app.bsky.embed.external#viewExternal', thumb: image }),
                            }
                            : undefined,
                        record: record,
                    },
                });
            });
        },
    });
}
export function useRemoveLiveStatusMutation() {
    var _this = this;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var agent = useAgent();
    var queryClient = useQueryClient();
    var control = useDialogContext();
    var _ = useLingui()._;
    return useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!currentAccount)
                            throw new Error('Not logged in');
                        return [4 /*yield*/, agent.app.bsky.actor.status.delete({
                                repo: currentAccount.did,
                                rkey: 'self',
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (e) {
            ax.logger.error("Failed to remove live status", {
                safeMessage: e,
            });
        },
        onSuccess: function () {
            ax.metric('live:remove', {});
            Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["You are no longer live"], ["You are no longer live"])))));
            control.close(function () {
                if (!currentAccount)
                    return;
                updateProfileShadow(queryClient, currentAccount.did, {
                    status: undefined,
                });
            });
        },
    });
}
var templateObject_1, templateObject_2, templateObject_3;
