import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMemo} from 'react'

export type GlobalLabelStrings = Record<
  string,
  {
    name: string
    description: string
  }
>

export function useGlobalLabelStrings(): GlobalLabelStrings {
  const {_} = useLingui()
  return useMemo(
    () => ({
      '!hide': {
        name: _(msg`Content Blocked`),
        description: _(msg`This content has been hidden by the moderators.`),
      },
      '!no-promote': {
        name: _(msg`Moderator Filter`),
        description: _(
          msg`Moderator has chosen to filter the content from feeds.`,
        ),
      },
      '!warn': {
        name: _(msg`Content Warning`),
        description: _(
          msg`This content has received a general warning from moderators.`,
        ),
      },
      '!no-unauthenticated': {
        name: _(msg`Sign-in Required`),
        description: _(
          msg`This user has requested that their content only be shown to signed-in users.`,
        ),
      },
      'dmca-violation': {
        name: _(msg`Copyright Violation`),
        description: _(
          msg`This content has received a DMCA takedown request. It will be restored if the concerns can be resolved.`,
        ),
      },
      doxxing: {
        name: _(msg`Doxxing`),
        description: _(
          msg`This content has been reported to include private information about someone without their consent.`,
        ),
      },
      porn: {
        name: _(msg`Pornography`),
        description: _(msg`Explicit sexual images.`),
      },
      sexual: {
        name: _(msg`Sexually Suggestive`),
        description: _(msg`Does not include nudity.`),
      },
      nudity: {
        name: _(msg`Nudity`),
        description: _(msg`Including non-sexual and artistic.`),
      },
      gore: {
        name: _(msg`Violent / Bloody`),
        description: _(msg`Gore, self-harm, torture`),
      },
    }),
    [_],
  )
}
