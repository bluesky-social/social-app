import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {getLabelStrings} from '#/lib/moderation/useLabelInfo'
import {useLabelDefinitions} from '#/state/preferences'
import {type tools} from '#/lexicons'

export type ActionedSubject =
  tools.ozone.inbox.listActionedSubjects.$OutputBody['subjects'][number]

export function useActionedSubjectLabels(item: ActionedSubject) {
  const {i18n, t: l} = useLingui()
  const {labelDefs} = useLabelDefinitions()
  const globalLabelStrings = useGlobalLabelStrings()
  const action = item.latestAction

  if (!action) return

  const isAccount = 'did' in item.subject
  const policyLabel = action.policies?.[0]?.displayName
  const label = action.labels?.[0] ?? item.enforcement.labels?.[0]
  const labelDefinition = label
    ? labelDefs[item.src]?.find(
        definition =>
          definition.identifier === label && definition.definedBy === item.src,
      )
    : undefined
  const labelName = label
    ? labelDefinition
      ? getLabelStrings(i18n.locale, globalLabelStrings, labelDefinition).name
      : (globalLabelStrings[label]?.name ?? label)
    : undefined

  let subject: string
  let summary: string | undefined
  switch (action.type) {
    case 'contentRemoved':
      subject = l`Your post was removed`
      summary = policyLabel
        ? l`Violates Community Guideline: ${policyLabel}`
        : undefined
      break
    case 'communicationSent':
      subject = l`We sent you an email about your account`
      summary = policyLabel
      break
    case 'labelApplied':
      subject = isAccount
        ? l`A label was added to your account`
        : l`A label was added to your post`
      summary = labelName ? l`Label: ${labelName}` : undefined
      break
    case 'accountSuspended': {
      subject = l`Your account was suspended`
      const expiresAt = action.expiresAt
      if (policyLabel && expiresAt) {
        const hours = Math.max(
          0,
          Math.round(
            (Date.parse(expiresAt) - Date.parse(action.createdAt)) / 3_600_000,
          ),
        )
        const duration = plural(hours, {
          one: '# hour',
          other: '# hours',
        })
        summary =
          // oxlint-disable-next-line react/react-compiler
          Date.parse(expiresAt) <= Date.now()
            ? l`${policyLabel} – ${duration}, now expired`
            : l`${policyLabel} – ${duration}`
      } else {
        summary = policyLabel
      }
      break
    }
    case 'accountTakedown':
      subject = l`Your account was suspended`
      summary = policyLabel
      break
    case 'reportingRestricted':
      subject = l`Your ability to submit reports was restricted`
      summary = policyLabel
      break
    case 'credentialsRevoked':
      subject = l`Your account credentials were revoked`
      summary = policyLabel
      break
    case 'labelRemoved':
      subject = isAccount
        ? l`A label was removed from your account`
        : l`A label was removed from your post`
      summary = labelName ? l`Label: ${labelName}` : undefined
      break
    default:
      return
  }

  return {subject, summary}
}
