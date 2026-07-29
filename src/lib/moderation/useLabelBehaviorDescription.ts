import {
  type InterpretedLabelValueDefinition,
  type LabelPreference,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

export function useLabelBehaviorDescription(
  labelValueDef: InterpretedLabelValueDefinition,
  pref: LabelPreference,
) {
  const {t: l} = useLingui()
  if (pref === 'ignore') {
    return l`Off`
  }
  if (labelValueDef.blurs === 'content' || labelValueDef.blurs === 'media') {
    if (pref === 'hide') {
      return l`Hide`
    }
    return l`Warn`
  } else if (labelValueDef.severity === 'alert') {
    if (pref === 'hide') {
      return l`Hide`
    }
    return l`Warn`
  } else if (labelValueDef.severity === 'inform') {
    if (pref === 'hide') {
      return l`Hide`
    }
    return l`Show badge`
  } else {
    if (pref === 'hide') {
      return l`Hide`
    }
    return l`Disabled`
  }
}

export function useLabelLongBehaviorDescription(
  labelValueDef: InterpretedLabelValueDefinition,
  pref: LabelPreference,
) {
  const {t: l} = useLingui()
  if (pref === 'ignore') {
    return l`Disabled`
  }
  if (labelValueDef.blurs === 'content') {
    if (pref === 'hide') {
      return l`Warn content and filter from feeds`
    }
    return l`Warn content`
  } else if (labelValueDef.blurs === 'media') {
    if (pref === 'hide') {
      return l`Blur images and filter from feeds`
    }
    return l`Blur images`
  } else if (labelValueDef.severity === 'alert') {
    if (pref === 'hide') {
      return l`Show warning and filter from feeds`
    }
    return l`Show warning`
  } else if (labelValueDef.severity === 'inform') {
    if (pref === 'hide') {
      return l`Show badge and filter from feeds`
    }
    return l`Show badge`
  } else {
    if (pref === 'hide') {
      return l`Filter from feeds`
    }
    return l`Disabled`
  }
}
