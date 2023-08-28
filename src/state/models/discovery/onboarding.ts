import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {hasProp} from 'lib/type-guards'
import {track} from 'lib/analytics/analytics'

export const OnboardingScreenSteps = {
  Welcome: 'Welcome',
  RecommendedFeeds: 'RecommendedFeeds',
  Home: 'Home',
} as const

type OnboardingStep =
  (typeof OnboardingScreenSteps)[keyof typeof OnboardingScreenSteps]
const OnboardingStepsArray = Object.values(OnboardingScreenSteps)
export class OnboardingModel {
  // state
  step: OnboardingStep

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false})
    this.step = 'Welcome'
  }

  serialize() {
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
        console.log('hydrating onboarding', v.step)
        this.step = v.step as OnboardingStep
      }
    }
    // if there is no valid state, we'll just reset
    this.reset()
  }

  nextScreenName(currentScreenName?: OnboardingStep) {
    if (currentScreenName === 'Welcome' || this.step === 'Welcome') {
      this.step = 'RecommendedFeeds'
      return this.step
    } else if (
      this.step === 'RecommendedFeeds' ||
      currentScreenName === 'RecommendedFeeds'
    ) {
      this.step = 'Home'
      return this.step
    } else {
      // if we get here, we're in an invalid state, let's just go Home
      return 'Home'
    }
  }

  reset() {
    this.step = 'Welcome'
  }

  skip() {
    track('Onboarding:Skipped')
    this.step = 'Home'
  }

  get isComplete() {
    return this.step === 'Home'
  }

  get isRemaining() {
    return !this.isComplete
  }
}
