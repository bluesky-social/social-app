import {LABEL_GROUPS} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMemo} from 'react'

export type LabelGroupStrings = Record<
  keyof typeof LABEL_GROUPS | 'other',
  {name: string; description: string}
>

export function useLabelGroupStrings(): LabelGroupStrings {
  const {_} = useLingui()
  return useMemo(
    () => ({
      system: {
        name: _(msg`System`),
        description: _(msg`Moderator overrides for special cases.`),
      },
      legal: {
        name: _(msg`Legal`),
        description: _(msg`Content removed for legal reasons.`),
      },
      'intellectual-property': {
        name: _(msg`Intellectual Property`),
        description: _(msg`Plagiarism, copying without attribution.`),
      },
      porn: {
        name: _(msg`Explicit Sexual Images`),
        description: _(msg`i.e. pornography.`),
      },
      suggestive: {
        name: _(msg`Sexually Suggestive`),
        description: _(msg`Does not include nudity.`),
      },
      nudity: {
        name: _(msg`Other Nudity`),
        description: _(msg`Including non-sexual and artistic.`),
      },
      violence: {
        name: _(msg`Violent / Bloody`),
        description: _(msg`Gore, self-harm, torture.`),
      },
      'drugs-alcohol': {
        name: _(msg`Substance Abuse`),
        description: _(msg`Use of drugs or alcohol.`),
      },
      'self-harm': {
        name: _(msg`Self Harm`),
        description: _(msg`Suicide, self-harm, eating disorders.`),
      },
      intolerance: {
        name: _(msg`Intolerance`),
        description: _(
          msg`Content or behavior which is hateful or intolerant toward a group of people.`,
        ),
      },
      'bad-behavior': {
        name: _(msg`Bad Behavior`),
        description: _(
          msg`Harassment, bullying, and threats toward other users.`,
        ),
      },
      rude: {
        name: _(msg`Rude`),
        description: _(msg`Behavior which is rude toward other users.`),
      },
      upsetting: {
        name: _(msg`Upsetting`),
        description: _(
          msg`Shocking, disgusting, or generally upsetting content.`,
        ),
      },
      troubling: {
        name: _(msg`Troubling`),
        description: _(
          msg`Bad news, troubling information, or dispiriting content.`,
        ),
      },
      'hate-group-mention': {
        name: _(msg`Hate Group Coverage`),
        description: _(
          msg`Images of terror groups, articles covering events, etc.`,
        ),
      },
      discourse: {
        name: _(msg`Discourse / Drama`),
        description: _(
          msg`On-going discussions or debates that may be frustrating.`,
        ),
      },
      curation: {
        name: _(msg`Curation`),
        description: _(
          msg`Judgment of the moderators to remove content not worth showing.`,
        ),
      },
      spam: {
        name: _(msg`Spam`),
        description: _(msg`Content which doesn't add to the conversation.`),
      },
      misrepresentation: {
        name: _(msg`Misrepresentation`),
        description: _(msg`Impersonations, scams.`),
      },
      security: {
        name: _(msg`Security`),
        description: _(msg`Potential security attacks.`),
      },
      misinfo: {
        name: _(msg`Misinformation`),
        description: _(msg`Content which misleads or defrauds users.`),
      },
      context: {
        name: _(msg`Context`),
        description: _(
          msg`Helpful annotations to explain intent, such as satire or parody.`,
        ),
      },
      other: {
        name: _(msg`Other`),
        description: _(msg`Other content not covered by the other categories.`),
      },
    }),
    [_],
  )
}
