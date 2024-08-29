import {ModerationCause} from '@atproto/api'

import {CircleInfo} from '../components/icons/CircleInfo.js'
import {EyeSlash} from '../components/icons/EyeSlash.js'
import {IconProps} from '../components/icons/types.js'
import {Warning} from '../components/icons/Warning.js'
import {ModeratorData} from '../data/getModeratorData.js'

export type ModerationCauseInfo = {
  icon: React.ComponentType<IconProps>
  name: string
  description?: string
  source: string
  sourceType: 'label' | string
  sourceDid: string
}

const globalLabelStrings = {
  '!hide': {
    name: `Content Blocked`,
    description: `This content has been hidden by the moderators.`,
  },
  '!warn': {
    name: `Content Warning`,
    description: `This content has received a general warning from moderators.`,
  },
  '!no-unauthenticated': {
    name: `Sign-in Required`,
    description: `This user has requested that their content only be shown to signed-in users.`,
  },
  porn: {
    name: `Adult Content`,
    description: `Explicit sexual images.`,
  },
  sexual: {
    name: `Sexually Suggestive`,
    description: `Does not include nudity.`,
  },
  nudity: {
    name: `Non-sexual Nudity`,
    description: `E.g. artistic nudes.`,
  },
  'graphic-media': {
    name: `Graphic Media`,
    description: `Explicit or potentially disturbing media.`,
  },
}

export function getModerationCauseInfo({
  cause,
  moderatorData,
}: {
  cause: ModerationCause
  moderatorData: ModeratorData
}): ModerationCauseInfo | undefined {
  if (!cause) return undefined

  if (cause.type === 'label') {
    const def = cause.labelDef
    const {name, description}: {name: string; description: string} =
      def.locales.find(l => l.lang === 'en') ||
      globalLabelStrings[def.identifier]
    const source =
      moderatorData.labeler.creator.displayName ||
      '@' + moderatorData.labeler.creator.handle

    return {
      icon:
        def.identifier === '!no-unauthenticated'
          ? EyeSlash
          : def.severity === 'alert'
          ? Warning
          : CircleInfo,
      name,
      description,
      source,
      sourceType: cause.source.type,
      // sourceAvi: labeler?.creator.avatar,
      sourceDid: cause.label.src,
    }
  }
}
