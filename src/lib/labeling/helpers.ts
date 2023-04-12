import {LabelValGroup, LABEL_VAL_GROUPS} from './const'

export function getLabelValueGroup(labelVal: string): LabelValGroup {
  for (const id in LABEL_VAL_GROUPS) {
    if (LABEL_VAL_GROUPS[id].values.includes(labelVal)) {
      return LABEL_VAL_GROUPS[id]
    }
  }
  return LABEL_VAL_GROUPS.unknown
}
