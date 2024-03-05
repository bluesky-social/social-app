import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMemo} from 'react'

export type LabelStrings = Record<
  string,
  {
    general: {name: string; description: string}
    account: {name: string; description: string}
    content: {name: string; description: string}
  }
>

export function useLabelStrings(): LabelStrings {
  const {_} = useLingui()
  return useMemo(
    () => ({
      '!hide': {
        general: {
          name: _(msg`Moderator Hide`),
          description: _(msg`Moderator has chosen to hide the content.`),
        },
        account: {
          name: _(msg`Content Blocked`),
          description: _(msg`This account has been hidden by the moderators.`),
        },
        content: {
          name: _(msg`Content Blocked`),
          description: _(msg`This content has been hidden by the moderators.`),
        },
      },
      '!no-promote': {
        general: {
          name: _(msg`Moderator Filter`),
          description: _(
            msg`Moderator has chosen to filter the content from feeds.`,
          ),
        },
        account: {
          name: _(msg`N/A`),
          description: _(msg`N/A`),
        },
        content: {
          name: _(msg`N/A`),
          description: _(msg`N/A`),
        },
      },
      '!warn': {
        general: {
          name: _(msg`Moderator Warn`),
          description: _(
            msg`Moderator has chosen to set a general warning on the content.`,
          ),
        },
        account: {
          name: _(msg`Content Warning`),
          description: _(
            msg`This account has received a general warning from moderators.`,
          ),
        },
        content: {
          name: _(msg`Content Warning`),
          description: _(
            msg`This content has received a general warning from moderators.`,
          ),
        },
      },
      '!no-unauthenticated': {
        general: {
          name: _(msg`Sign-in Required`),
          description: _(
            msg`This user has requested that their account only be shown to signed-in users.`,
          ),
        },
        account: {
          name: _(msg`Sign-in Required`),
          description: _(
            msg`This user has requested that their account only be shown to signed-in users.`,
          ),
        },
        content: {
          name: _(msg`Sign-in Required`),
          description: _(
            msg`This user has requested that their content only be shown to signed-in users.`,
          ),
        },
      },
      'dmca-violation': {
        general: {
          name: _(msg`Copyright Violation`),
          description: _(
            msg`The content has received a DMCA takedown request.`,
          ),
        },
        account: {
          name: _(msg`Copyright Violation`),
          description: _(
            msg`This account has received a DMCA takedown request. It will be restored if the concerns can be resolved.`,
          ),
        },
        content: {
          name: _(msg`Copyright Violation`),
          description: _(
            msg`This content has received a DMCA takedown request. It will be restored if the concerns can be resolved.`,
          ),
        },
      },
      doxxing: {
        general: {
          name: _(msg`Doxxing`),
          description: _(
            msg`Information that reveals private information about someone which has been shared without the consent of the subject.`,
          ),
        },
        account: {
          name: _(msg`Doxxing`),
          description: _(
            msg`This account has been reported to publish private information about someone without their consent. This report is currently under review.`,
          ),
        },
        content: {
          name: _(msg`Doxxing`),
          description: _(
            msg`This content has been reported to include private information about someone without their consent.`,
          ),
        },
      },
      porn: {
        general: {
          name: _(msg`Pornography`),
          description: _(msg`Explicit sexual images.`),
        },
        account: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This account contains imagery of full-frontal nudity or explicit sexual activity.`,
          ),
        },
        content: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This content contains imagery of full-frontal nudity or explicit sexual activity.`,
          ),
        },
      },
      sexual: {
        general: {
          name: _(msg`Sexually Suggestive`),
          description: _(msg`Does not include nudity.`),
        },
        account: {
          name: _(msg`Suggestive Content`),
          description: _(
            msg`This account contains imagery which is sexually suggestive. Common examples include selfies in underwear or in partial undress.`,
          ),
        },
        content: {
          name: _(msg`Suggestive Content`),
          description: _(
            msg`This content contains imagery which is sexually suggestive. Common examples include selfies in underwear or in partial undress.`,
          ),
        },
      },
      nudity: {
        general: {
          name: _(msg`Nudity`),
          description: _(msg`Including non-sexual and artistic.`),
        },
        account: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This account contains imagery which portrays nudity in a non-sexual or artistic setting.`,
          ),
        },
        content: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This content contains imagery which portrays nudity in a non-sexual or artistic setting.`,
          ),
        },
      },
      gore: {
        general: {
          name: _(msg`Violent / Bloody`),
          description: _(msg`Gore, self-harm, torture`),
        },
        account: {
          name: _(msg`Graphic Imagery (Gore)`),
          description: _(
            msg`This account contains shocking images involving blood or visible wounds.`,
          ),
        },
        content: {
          name: _(msg`Graphic Imagery (Gore)`),
          description: _(
            msg`This content contains shocking images involving blood or visible wounds.`,
          ),
        },
      },
    }),
    [_],
  )
}
