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
  hidden: boolean
} | {
  type: NudgeType.interstitialSuggestedFollows
  hidden: boolean
}

export type ProgressGuides = {
  type: NudgeType.progressGuide_like10Follow7
  numLikes: number
  numFollows: number
  complete: boolean
}

export type Nudge = Interstitials | ProgressGuides
