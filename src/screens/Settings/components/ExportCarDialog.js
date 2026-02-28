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
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DM_SERVICE_HEADERS } from '#/lib/constants';
import { saveBytesToDisk } from '#/lib/media/manip';
import { logger } from '#/logger';
import { useAgent } from '#/state/session';
import { atoms as a, useTheme, web } from '#/alf';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
export function ExportCarDialog(_a) {
    var _this = this;
    var control = _a.control;
    var _ = useLingui()._;
    var t = useTheme();
    var agent = useAgent();
    var _b = useState(false), loading = _b[0], setLoading = _b[1];
    var download = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var did, downloadRes, saveRes, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!agent.session) {
                        return [2 /*return*/]; // shouldnt ever happen
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    setLoading('repo');
                    did = agent.session.did;
                    return [4 /*yield*/, agent.com.atproto.sync.getRepo({ did: did })];
                case 2:
                    downloadRes = _a.sent();
                    return [4 /*yield*/, saveBytesToDisk('repo.car', downloadRes.data, downloadRes.headers['content-type'] || 'application/vnd.ipld.car')];
                case 3:
                    saveRes = _a.sent();
                    if (saveRes) {
                        Toast.show(_(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["File saved successfully!"], ["File saved successfully!"])))));
                    }
                    return [3 /*break*/, 6];
                case 4:
                    e_1 = _a.sent();
                    logger.error('Error occurred while downloading CAR file', { message: e_1 });
                    Toast.show(_(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Error occurred while saving file"], ["Error occurred while saving file"])))), { type: 'error' });
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    control.close();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [_, control, agent]);
    var downloadChatData = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, _a, saveRes, e_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!agent.session) {
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, 6, 7]);
                    setLoading('chat');
                    return [4 /*yield*/, agent.sessionManager.fetchHandler('/xrpc/chat.bsky.actor.exportAccountData', { headers: DM_SERVICE_HEADERS })];
                case 2:
                    res = _b.sent();
                    if (!res.ok) {
                        throw new Error("HTTP ".concat(res.status));
                    }
                    _a = Uint8Array.bind;
                    return [4 /*yield*/, res.arrayBuffer()];
                case 3:
                    data = new (_a.apply(Uint8Array, [void 0, _b.sent()]))();
                    return [4 /*yield*/, saveBytesToDisk('chat.jsonl', data, res.headers.get('content-type') || 'application/jsonl')];
                case 4:
                    saveRes = _b.sent();
                    if (saveRes) {
                        Toast.show(_(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["File saved successfully!"], ["File saved successfully!"])))));
                    }
                    return [3 /*break*/, 7];
                case 5:
                    e_2 = _b.sent();
                    logger.error('Error occurred while downloading chat data', { message: e_2 });
                    Toast.show(_(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Error occurred while saving file"], ["Error occurred while saving file"])))), { type: 'error' });
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    control.close();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [_, control, agent]);
    return (_jsxs(Dialog.Outer, { control: control, nativeOptions: { preventExpansion: true }, children: [_jsx(Dialog.Handle, {}), _jsxs(Dialog.ScrollableInner, { accessibilityDescribedBy: "dialog-description", accessibilityLabelledBy: "dialog-title", style: web({ maxWidth: 500 }), children: [_jsxs(View, { style: [a.relative, a.gap_lg, a.w_full], children: [_jsx(Text, { nativeID: "dialog-title", style: [a.text_2xl, a.font_bold], children: _jsx(Trans, { children: "Export My Data" }) }), _jsx(Text, { nativeID: "dialog-description", style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "Your account repository, containing all public data records, can be downloaded as a \"CAR\" file. This file does not include media embeds, such as images, or your private data, which must be fetched separately." }) }), _jsxs(Button, { color: "primary", size: "large", label: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Download CAR file"], ["Download CAR file"])))), disabled: !!loading, onPress: download, children: [_jsx(ButtonIcon, { icon: DownloadIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Download CAR file" }) }), loading === 'repo' && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Text, { style: [a.text_sm, a.leading_snug, t.atoms.text_contrast_high], children: _jsx(Trans, { children: "You can also download your chat data as a \"JSONL\" file. This file only includes chat messages that you have sent and does not include chat messages that you have received." }) }), _jsxs(Button, { color: "secondary", size: "large", label: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Download chat data"], ["Download chat data"])))), disabled: !!loading, onPress: downloadChatData, children: [_jsx(ButtonIcon, { icon: DownloadIcon }), _jsx(ButtonText, { children: _jsx(Trans, { children: "Download chat data" }) }), loading === 'chat' && _jsx(ButtonIcon, { icon: Loader })] }), _jsx(Text, { style: [
                                    t.atoms.text_contrast_medium,
                                    a.text_sm,
                                    a.leading_snug,
                                    a.flex_1,
                                ], children: _jsxs(Trans, { children: ["This feature is in beta. You can read more about repository exports in", ' ', _jsx(InlineLinkText, { label: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["View blogpost for more details"], ["View blogpost for more details"])))), to: "https://docs.bsky.app/blog/repo-export", style: [a.text_sm], children: "this blogpost" }), "."] }) })] }), _jsx(Dialog.Close, {})] })] }));
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
