import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {hasProp} from 'lib/type-guards'
import {track} from 'lib/analytics/analytics'
import {SuggestedActorsModel} from './suggested-actors'

export const OnboardingScreenSteps = {
  Welcome: 'Welcome',
  RecommendedFeeds: 'RecommendedFeeds',
  RecommendedFollows: 'RecommendedFollows',
  Home: 'Home',
} as const

type OnboardingStep =
  (typeof OnboardingScreenSteps)[keyof typeof OnboardingScreenSteps]
const OnboardingStepsArray = Object.values(OnboardingScreenSteps)
export class OnboardingModel {
  // state
  step: OnboardingStep = 'Home' // default state to skip onboarding, only enabled for new users by calling start()

  // data
  suggestedActors: SuggestedActorsModel

  constructor(public rootStore: RootStoreModel) {
    this.suggestedActors = new SuggestedActorsModel(this.rootStore)
    makeAutoObservable(this, {
      rootStore: false,
      hydrate: false,
      serialize: false,
    })
  }

  serialize(): unknown {
    return {
      step: this.step,
    }
  }

  hydrate(v: unknown) {
    if (typeof v === 'object' && v !== null) {
      if (
        hasProp(v, 'step') &&
        typeof v.step === 'string' &&
        OnboardingStepsArray.includes(v.step as OnboardingStep)
      ) {
        this.step = v.step as OnboardingStep
      }
    } else {
      // if there is no valid state, we'll just reset
      this.reset()
    }
  }

  /**
   * Returns the name of the next screen in the onboarding process based on the current step or screen name provided.
   * @param {OnboardingStep} [currentScreenName]
   * @returns name of next screen in the onboarding process
   */
  next(currentScreenName?: OnboardingStep) {
    currentScreenName = currentScreenName || this.step
    if (currentScreenName === 'Welcome') {
      this.step = 'RecommendedFeeds'
      return this.step
    } else if (this.step === 'RecommendedFeeds') {
      this.step = 'RecommendedFollows'
      // prefetch recommended follows
      this.suggestedActors.loadMore(true)
      return this.step
    } else if (this.step === 'RecommendedFollows') {
      this.finish()
      return this.step
    } else {
      // if we get here, we're in an invalid state, let's just go Home
      return 'Home'
    }
  }

  start() {
    this.step = 'Welcome'
    track('Onboarding:Begin')
  }

  finish() {
    this.rootStore.me.mainFeed.refresh() // load the selected content
    this.step = 'Home'
    track('Onboarding:Complete')
  }

  reset() {
    this.step = 'Welcome'
    track('Onboarding:Reset')
  }

  skip() {
    this.step = 'Home'
    track('Onboarding:Skipped')
  }

  get isComplete() {
    return this.step === 'Home'
  }

  get isActive() {
    return !this.isComplete
  }
}
