// import {useQueueNudgesMutation, useDismissNudgesMutation} from '#/state/queries/preferences'

export enum NudgeType {
  /*
   * Feed interstitials
   */
  interstitialPopularFeeds = 'interstitialPopularFeeds',
  interstitialSuggestedFollows = 'interstitialSuggestedFollows',

  /*
   * Progress guides
   */
  progressGuide_like10Follow7 = 'progressGuide_like10Follow7',
}

export type Interstitials = {
  type: NudgeType.interstitialPopularFeeds
} | {
  type: NudgeType.interstitialSuggestedFollows
}

export type ProgressGuides = {
  type: NudgeType.progressGuide_like10Follow7
  numLikes: number
  numFollows: number
}

export type Nudge = Interstitials | ProgressGuides

let __temp_storage: Nudge[] = []

export function useQueueNudges() {
  const queueNudges = async (nudges: Nudge[]) => {
    __temp_storage.push(...nudges)
  }

  return { queueNudges }
}

export function useDismissNudges() {
  const dismissNudges = async (nudges: Nudge[]) => {
    __temp_storage = __temp_storage.filter(n => {
      return !nudges.some(nudge => nudge.type === n.type)
    })
  }

  return { dismissNudges }
}
