/* eslint-disable no-restricted-imports */
import {
  AppBskyLabelerDefs,
  AtpAgent,
  BSKY_LABELER_DID,
  DEFAULT_LABEL_SETTINGS,
  interpretLabelValueDefinitions,
  moderatePost,
} from '@atproto/api'

export type ModeratorData = Awaited<ReturnType<typeof getModeratorData>>

export const DEFAULT_LABELS: typeof DEFAULT_LABEL_SETTINGS = Object.fromEntries(
  Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
)

export async function getModeratorData(agent: AtpAgent) {
  const {data} = await agent.app.bsky.labeler.getServices({
    dids: [BSKY_LABELER_DID],
    detailed: true,
  })
  if (!data || !data.views[0]) {
    throw new Error(`Could not fetch label definitions`)
  }
  const labeler = data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed
  const definitions = interpretLabelValueDefinitions(labeler)
  const moderationOptions: Parameters<typeof moderatePost>[1] = {
    userDid: undefined,
    prefs: {
      adultContentEnabled: false,
      labels: DEFAULT_LABELS,
      mutedWords: [],
      hiddenPosts: [],
      labelers: [
        {
          did: BSKY_LABELER_DID,
          labels: DEFAULT_LABELS,
        },
      ],
    },
    labelDefs: {
      [BSKY_LABELER_DID]: definitions,
    },
  }

  return {
    labeler,
    moderationOptions,
  }
}
