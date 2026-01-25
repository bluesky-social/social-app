import { interpretLabelValueDefinition, LABELS, } from '@atproto/api';
import { useLingui } from '@lingui/react';
import * as bcp47Match from 'bcp-47-match';
import { useGlobalLabelStrings, } from '#/lib/moderation/useGlobalLabelStrings';
import { useLabelDefinitions } from '#/state/preferences';
export function useLabelInfo(label) {
    var i18n = useLingui().i18n;
    var _a = useLabelDefinitions(), labelDefs = _a.labelDefs, labelers = _a.labelers;
    var globalLabelStrings = useGlobalLabelStrings();
    var def = getDefinition(labelDefs, label);
    return {
        label: label,
        def: def,
        strings: getLabelStrings(i18n.locale, globalLabelStrings, def),
        labeler: labelers.find(function (labeler) { return label.src === labeler.creator.did; }),
    };
}
export function getDefinition(labelDefs, label) {
    var _a;
    // check local definitions
    var customDef = !label.val.startsWith('!') &&
        ((_a = labelDefs[label.src]) === null || _a === void 0 ? void 0 : _a.find(function (def) { return def.identifier === label.val && def.definedBy === label.src; }));
    if (customDef) {
        return customDef;
    }
    // check global definitions
    var globalDef = LABELS[label.val];
    if (globalDef) {
        return globalDef;
    }
    // fallback to a noop definition
    return interpretLabelValueDefinition({
        identifier: label.val,
        severity: 'none',
        blurs: 'none',
        defaultSetting: 'ignore',
        locales: [],
    }, label.src);
}
export function getLabelStrings(locale, globalLabelStrings, def) {
    if (!def.definedBy) {
        // global definition, look up strings
        if (def.identifier in globalLabelStrings) {
            return globalLabelStrings[def.identifier];
        }
    }
    else {
        // try to find locale match in the definition's strings
        var localeMatch = def.locales.find(function (strings) { return bcp47Match.basicFilter(locale, strings.lang).length > 0; });
        if (localeMatch) {
            return localeMatch;
        }
        // fall back to the zero item if no match
        if (def.locales[0]) {
            return def.locales[0];
        }
    }
    return {
        lang: locale,
        name: def.identifier,
        description: "Labeled \"".concat(def.identifier, "\""),
    };
}
