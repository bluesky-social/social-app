var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React from 'react';
import { BskyAgent, LABELS, } from '@atproto/api';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';
export var ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn'];
export var OTHER_SELF_LABELS = ['graphic-media'];
export var SELF_LABELS = __spreadArray(__spreadArray([], ADULT_CONTENT_LABELS, true), OTHER_SELF_LABELS, true);
export function getModerationCauseKey(cause) {
    var source = cause.source.type === 'labeler'
        ? cause.source.did
        : cause.source.type === 'list'
            ? cause.source.list.uri
            : 'user';
    if (cause.type === 'label') {
        return "label:".concat(cause.label.val, ":").concat(source);
    }
    return "".concat(cause.type, ":").concat(source);
}
export function isJustAMute(modui) {
    return modui.filters.length === 1 && modui.filters[0].type === 'muted';
}
export function moduiContainsHideableOffense(modui) {
    var label = modui.filters.at(0);
    if (label && label.type === 'label') {
        return labelIsHideableOffense(label.label);
    }
    return false;
}
export function labelIsHideableOffense(label) {
    return ['!hide', '!takedown'].includes(label.val);
}
export function getLabelingServiceTitle(_a) {
    var displayName = _a.displayName, handle = _a.handle;
    return displayName
        ? sanitizeDisplayName(displayName)
        : sanitizeHandle(handle, '@');
}
export function lookupLabelValueDefinition(labelValue, customDefs) {
    var def;
    if (!labelValue.startsWith('!') && customDefs) {
        def = customDefs.find(function (d) { return d.identifier === labelValue; });
    }
    if (!def) {
        def = LABELS[labelValue];
    }
    return def;
}
export function isAppLabeler(labeler) {
    if (typeof labeler === 'string') {
        return BskyAgent.appLabelers.includes(labeler);
    }
    return BskyAgent.appLabelers.includes(labeler.creator.did);
}
export function isLabelerSubscribed(labeler, modOpts) {
    labeler = typeof labeler === 'string' ? labeler : labeler.creator.did;
    if (isAppLabeler(labeler)) {
        return true;
    }
    return modOpts.prefs.labelers.find(function (l) { return l.did === labeler; });
}
export function useLabelSubject(_a) {
    var label = _a.label;
    return React.useMemo(function () {
        var cid = label.cid, uri = label.uri;
        if (cid) {
            return {
                subject: {
                    uri: uri,
                    cid: cid,
                },
            };
        }
        else {
            return {
                subject: {
                    did: uri,
                },
            };
        }
    }, [label]);
}
export function unique(value, index, array) {
    return (array.findIndex(function (item) { return getModerationCauseKey(item) === getModerationCauseKey(value); }) === index);
}
