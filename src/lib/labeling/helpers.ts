import {
  LabelValGroup,
  CONFIGURABLE_LABEL_GROUPS,
  ILLEGAL_LABEL_GROUP,
  UNKNOWN_LABEL_GROUP,
} from './const'

export function getLabelValueGroup(labelVal: string): LabelValGroup {
  let id: keyof typeof CONFIGURABLE_LABEL_GROUPS
  for (id in CONFIGURABLE_LABEL_GROUPS) {
    if (ILLEGAL_LABEL_GROUP.values.includes(labelVal)) {
      return ILLEGAL_LABEL_GROUP
    }
    if (CONFIGURABLE_LABEL_GROUPS[id].values.includes(labelVal)) {
      return CONFIGURABLE_LABEL_GROUPS[id]
    }
  }
  return UNKNOWN_LABEL_GROUP
}
