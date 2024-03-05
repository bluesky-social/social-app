import {InterprettedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

export function useLabelBehaviorDescription(
  labelValueDef: InterprettedLabelValueDefinition,
  pref: LabelPreference,
) {
  const {_} = useLingui()
  if (pref === 'ignore') {
    return _(msg`Disabled`)
  }
  if (labelValueDef.blurs === 'content') {
    if (pref === 'hide') {
      return _(msg`Hide content`)
    }
    return _(msg`Warn content`)
  } else if (labelValueDef.blurs === 'media') {
    if (pref === 'hide') {
      return _(msg`Hide images`)
    }
    return _(msg`Warn images`)
  } else if (labelValueDef.severity === 'alert') {
    if (pref === 'hide') {
      return _(msg`Filter from feeds`)
    }
    return _(msg`Show warning`)
  } else if (labelValueDef.severity === 'inform') {
    if (pref === 'hide') {
      return _(msg`Filter from feeds`)
    }
    return _(msg`Show badge`)
  } else {
    if (pref === 'hide') {
      return _(msg`Filter from feeds`)
    }
    return _(msg`Disabled`)
  }
}
