/* eslint-disable-next-line no-restricted-imports */
import {
  AppBskyLabelerDefs,
  AtpAgent,
  BSKY_LABELER_DID,
  DEFAULT_LABEL_SETTINGS,
  interpretLabelValueDefinitions,
  moderatePost as defaultModeratePost,
} from '@atproto/api'

type ModeratePost = typeof defaultModeratePost
export type Subject = Parameters<ModeratePost>[0]
export type Options = Parameters<ModeratePost>[1]

function translateOldLabels(subject: Parameters<ModeratePost>[0]) {
  if (subject.labels) {
    for (const label of subject.labels) {
      if (
        label.val === 'gore' &&
        (!label.src || label.src === BSKY_LABELER_DID)
      ) {
        label.val = 'graphic-media'
      }
    }
  }
}

export const DEFAULT_LABELS: typeof DEFAULT_LABEL_SETTINGS = Object.fromEntries(
  Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
)

export function moderatePost(post: Subject, opts: Options) {
  // HACK
  // temporarily translate 'gore' into 'graphic-media' during the transition period
  // can remove this in a few months
  // -prf
  translateOldLabels(post)

  return defaultModeratePost(post, opts)
}

export async function getModerationOptions(agent: AtpAgent) {
  const labelDefs = await getLabelDefinitions(agent)
  const opts: Options = {
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
      [BSKY_LABELER_DID]: labelDefs,
    },
  }
  return opts
}

export async function getLabelDefinitions(agent: AtpAgent) {
  const {data} = await agent.app.bsky.labeler.getServices({
    dids: [BSKY_LABELER_DID],
    detailed: true,
  })
  if (!data || !data.views[0]) {
    throw new Error(`Could not fetch label definitions`)
  }
  const labeler = data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed

  return interpretLabelValueDefinitions(labeler)
}
