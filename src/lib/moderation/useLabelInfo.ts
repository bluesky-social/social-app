import {
  type InterpretedLabelValueDefinition,
  interpretLabelValueDefinition,
  LABELS,
} from '@bsky.app/sdk/moderation'
import {useLingui} from '@lingui/react'
import * as bcp47Match from 'bcp-47-match'

import {
  type GlobalLabelStrings,
  useGlobalLabelStrings,
} from '#/lib/moderation/useGlobalLabelStrings'
import {useLabelDefinitions} from '#/state/preferences'
import {type app, type com} from '#/lexicons'
import {toLex} from '#/types/bsky'

export interface LabelInfo {
  label: com.atproto.label.defs.Label
  def: InterpretedLabelValueDefinition
  strings: com.atproto.label.defs.LabelValueDefinitionStrings
  labeler: app.bsky.labeler.defs.LabelerViewDetailed | undefined
}

export function useLabelInfo(label: com.atproto.label.defs.Label): LabelInfo {
  const {i18n} = useLingui()
  /*
   * TODO(phase4): drop the `toLex` casts once `useLabelDefinitions`
   * (state/preferences/label-defs) emits `#/lexicons` / `@bsky.app/sdk`
   * moderation types. It still returns old `@atproto/api`
   * `InterpretedLabelValueDefinition` / `LabelerViewDetailed`, which are
   * structurally identical to the SDK/lexicon ones modulo branded strings.
   */
  const {labelDefs, labelers} = useLabelDefinitions()
  const def = getDefinition(
    toLex<Record<string, InterpretedLabelValueDefinition[]>>(labelDefs),
    label,
  )
  const globalLabelStrings = useGlobalLabelStrings()
  return {
    label,
    def,
    strings: getLabelStrings(i18n.locale, globalLabelStrings, def),
    labeler: toLex<app.bsky.labeler.defs.LabelerViewDetailed[]>(labelers).find(
      labeler => label.src === labeler.creator.did,
    ),
  }
}

export function getDefinition(
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>,
  label: com.atproto.label.defs.Label,
): InterpretedLabelValueDefinition {
  // check local definitions
  const customDef =
    !label.val.startsWith('!') &&
    labelDefs[label.src]?.find(
      def => def.identifier === label.val && def.definedBy === label.src,
    )
  if (customDef) {
    return customDef
  }

  // check global definitions
  const globalDef = LABELS[label.val as keyof typeof LABELS]
  if (globalDef) {
    return globalDef
  }

  // fallback to a noop definition
  return interpretLabelValueDefinition(
    {
      identifier: label.val,
      severity: 'none',
      blurs: 'none',
      defaultSetting: 'ignore',
      locales: [],
    },
    label.src,
  )
}

export function getLabelStrings(
  locale: string,
  globalLabelStrings: GlobalLabelStrings,
  def: InterpretedLabelValueDefinition,
): com.atproto.label.defs.LabelValueDefinitionStrings {
  if (!def.definedBy) {
    // global definition, look up strings
    if (def.identifier in globalLabelStrings) {
      return globalLabelStrings[
        def.identifier
      ] as com.atproto.label.defs.LabelValueDefinitionStrings
    }
  } else {
    // try to find locale match in the definition's strings
    const localeMatch = def.locales.find(
      strings => bcp47Match.basicFilter(locale, strings.lang).length > 0,
    )
    if (localeMatch) {
      return localeMatch
    }
    // fall back to the zero item if no match
    if (def.locales[0]) {
      return def.locales[0]
    }
  }
  return {
    lang: locale,
    name: def.identifier,
    description: `Labeled "${def.identifier}"`,
  }
}
