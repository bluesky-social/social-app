var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import React from 'react';
import { BSKY_LABELER_DID, } from '@atproto/api';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { sanitizeHandle } from '#/lib/strings/handles';
import { useLabelDefinitions } from '#/state/preferences';
import { useSession } from '#/state/session';
import { CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign } from '#/components/icons/CircleBanSign';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlash } from '#/components/icons/EyeSlash';
import { Warning_Stroke2_Corner0_Rounded as Warning } from '#/components/icons/Warning';
import { useGlobalLabelStrings } from './useGlobalLabelStrings';
import { getDefinition, getLabelStrings } from './useLabelInfo';
export function useModerationCauseDescription(cause) {
    var currentAccount = useSession().currentAccount;
    var _a = useLingui(), _ = _a._, i18n = _a.i18n;
    var _b = useLabelDefinitions(), labelDefs = _b.labelDefs, labelers = _b.labelers;
    var globalLabelStrings = useGlobalLabelStrings();
    return React.useMemo(function () {
        if (!cause) {
            return {
                icon: Warning,
                name: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Content Warning"], ["Content Warning"])))),
                description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Moderator has chosen to set a general warning on the content."], ["Moderator has chosen to set a general warning on the content."])))),
            };
        }
        if (cause.type === 'blocking') {
            if (cause.source.type === 'list') {
                return {
                    icon: CircleBanSign,
                    name: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["User Blocked by \"", "\""], ["User Blocked by \"", "\""])), cause.source.list.name)),
                    description: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["You have blocked this user. You cannot view their content."], ["You have blocked this user. You cannot view their content."])))),
                };
            }
            else {
                return {
                    icon: CircleBanSign,
                    name: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["User Blocked"], ["User Blocked"])))),
                    description: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["You have blocked this user. You cannot view their content."], ["You have blocked this user. You cannot view their content."])))),
                };
            }
        }
        if (cause.type === 'blocked-by') {
            return {
                icon: CircleBanSign,
                name: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["User Blocking You"], ["User Blocking You"])))),
                description: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["This user has blocked you. You cannot view their content."], ["This user has blocked you. You cannot view their content."])))),
            };
        }
        if (cause.type === 'block-other') {
            return {
                icon: CircleBanSign,
                name: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Content Not Available"], ["Content Not Available"])))),
                description: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["This content is not available because one of the users involved has blocked the other."], ["This content is not available because one of the users involved has blocked the other."])))),
            };
        }
        if (cause.type === 'muted') {
            if (cause.source.type === 'list') {
                return {
                    icon: EyeSlash,
                    name: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Muted by \"", "\""], ["Muted by \"", "\""])), cause.source.list.name)),
                    description: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["You have muted this user"], ["You have muted this user"])))),
                };
            }
            else {
                return {
                    icon: EyeSlash,
                    name: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Account Muted"], ["Account Muted"])))),
                    description: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["You have muted this account."], ["You have muted this account."])))),
                };
            }
        }
        if (cause.type === 'mute-word') {
            return {
                icon: EyeSlash,
                name: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Post Hidden by Muted Word"], ["Post Hidden by Muted Word"])))),
                description: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["You've chosen to hide a word or tag within this post."], ["You've chosen to hide a word or tag within this post."])))),
            };
        }
        if (cause.type === 'hidden') {
            return {
                icon: EyeSlash,
                name: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Post Hidden by You"], ["Post Hidden by You"])))),
                description: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["You have hidden this post"], ["You have hidden this post"])))),
            };
        }
        if (cause.type === 'reply-hidden') {
            var isMe = (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) === cause.source.did;
            return {
                icon: EyeSlash,
                name: isMe
                    ? _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Reply Hidden by You"], ["Reply Hidden by You"]))))
                    : _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Reply Hidden by Thread Author"], ["Reply Hidden by Thread Author"])))),
                description: isMe
                    ? _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["You hid this reply."], ["You hid this reply."]))))
                    : _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["The author of this thread has hidden this reply."], ["The author of this thread has hidden this reply."])))),
            };
        }
        if (cause.type === 'label') {
            var def = cause.labelDef || getDefinition(labelDefs, cause.label);
            var strings = getLabelStrings(i18n.locale, globalLabelStrings, def);
            var labeler = labelers.find(function (l) { return l.creator.did === cause.label.src; });
            var source = labeler
                ? sanitizeHandle(labeler.creator.handle, '@')
                : undefined;
            var sourceDisplayName = labeler === null || labeler === void 0 ? void 0 : labeler.creator.displayName;
            if (!source) {
                if (cause.label.src === BSKY_LABELER_DID) {
                    source = 'moderation.bsky.app';
                    sourceDisplayName = 'Bluesky Moderation Service';
                }
                else {
                    source = _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["an unknown labeler"], ["an unknown labeler"]))));
                }
            }
            if (def.identifier === 'porn' || def.identifier === 'sexual') {
                strings.name = _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Adult Content"], ["Adult Content"]))));
            }
            return {
                icon: def.identifier === '!no-unauthenticated'
                    ? EyeSlash
                    : def.severity === 'alert'
                        ? Warning
                        : CircleInfo,
                name: strings.name,
                description: strings.description,
                source: source,
                sourceDisplayName: sourceDisplayName,
                sourceType: cause.source.type,
                sourceAvi: labeler === null || labeler === void 0 ? void 0 : labeler.creator.avatar,
                sourceDid: cause.label.src,
                isSubjectAccount: cause.label.uri.startsWith('did:'),
            };
        }
        // should never happen
        return {
            icon: CircleInfo,
            name: '',
            description: "",
        };
    }, [
        labelDefs,
        labelers,
        globalLabelStrings,
        cause,
        _,
        i18n.locale,
        currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did,
    ]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24;
