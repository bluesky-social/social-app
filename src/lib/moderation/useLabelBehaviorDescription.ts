import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function useLabelBehaviorDescription(
  labelValueDef: InterpretedLabelValueDefinition,
  pref: LabelPreference,
) {
  const {_} = useLingui()
  if (pref === 'ignore') {
    return _(msg`Off`)
  }
  if (labelValueDef.blurs === 'content' || labelValueDef.blurs === 'media') {
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Warn`)
  } else if (labelValueDef.severity === 'alert') {
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Warn`)
  } else if (labelValueDef.severity === 'inform') {
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Show badge`)
  } else {
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Disabled`)
  }
}

export function useLabelLongBehaviorDescription(
  labelValueDef: InterpretedLabelValueDefinition,
  pref: LabelPreference,
) {
  const {_} = useLingui()
  if (pref === 'ignore') {
    return _(msg`Disabled`)
  }
  if (labelValueDef.blurs === 'content') {
    if (pref === 'hide') {
      return _(msg`Warn content and filter from feeds`)
    }
    return _(msg`Warn content`)
  } else if (labelValueDef.blurs === 'media') {
    if (pref === 'hide') {
      return _(msg`Blur images and filter from feeds`)
    }
    return _(msg`Blur images`)
  } else if (labelValueDef.severity === 'alert') {
    if (pref === 'hide') {
      return _(msg`Show warning and filter from feeds`)
    }
    return _(msg`Show warning`)
  } else if (labelValueDef.severity === 'inform') {
    if (pref === 'hide') {
      return _(msg`Show badge and filter from feeds`)
    }
    return _(msg`Show badge`)
  } else {
    if (pref === 'hide') {
      return _(msg`Filter from feeds`)
    }
    return _(msg`Disabled`)
  }
}
