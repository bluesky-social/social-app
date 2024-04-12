import {
  AppBskyLabelerDefs,
  ComAtprotoLabelDefs,
  InterpretedLabelValueDefinition,
  interpretLabelValueDefinition,
  LABELS,
} from '@atproto/api'
import {useLingui} from '@lingui/react'
import * as bcp47Match from 'bcp-47-match'

import {
  GlobalLabelStrings,
  useGlobalLabelStrings,
} from '#/lib/moderation/useGlobalLabelStrings'
import {useLabelDefinitions} from '#/state/preferences'

export interface LabelInfo {
  label: ComAtprotoLabelDefs.Label
  def: InterpretedLabelValueDefinition
  strings: ComAtprotoLabelDefs.LabelValueDefinitionStrings
  labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined
}

export function useLabelInfo(label: ComAtprotoLabelDefs.Label): LabelInfo {
  const {i18n} = useLingui()
  const {labelDefs, labelers} = useLabelDefinitions()
  const globalLabelStrings = useGlobalLabelStrings()
  const def = getDefinition(labelDefs, label)
  return {
    label,
    def,
    strings: getLabelStrings(i18n.locale, globalLabelStrings, def),
    labeler: labelers.find(labeler => label.src === labeler.creator.did),
  }
}

export function getDefinition(
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>,
  label: ComAtprotoLabelDefs.Label,
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
): ComAtprotoLabelDefs.LabelValueDefinitionStrings {
  if (!def.definedBy) {
    // global definition, look up strings
    if (def.identifier in globalLabelStrings) {
      return globalLabelStrings[
        def.identifier
      ] as ComAtprotoLabelDefs.LabelValueDefinitionStrings
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
