import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {NavigationProp} from 'lib/routes/types'
import {hasProp} from 'lib/type-guards'

export const OnboardingScreenSteps = {
  Welcome: 'Welcome',
  RecommendedFeeds: 'RecommendedFeeds',
  Complete: 'Complete',
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
        this.step = v.step as OnboardingStep
      }
    }
    // if there is no valid state, we'll just reset
    this.reset()
  }

  nextScreenName() {
    console.log('currentScreen', this.step)
    if (this.step === 'Welcome') {
      this.step = 'RecommendedFeeds'
      return this.step
    } else if (this.step === 'RecommendedFeeds') {
      this.step = 'Complete'
      return this.step
    } else if (this.step === 'Complete') {
      return 'Home'
    } else {
      // if we get here, we're in an invalid state, let's just go Home
      return 'Home'
    }
  }

  complete(navigation: NavigationProp) {
    navigation.navigate('Home')
  }

  reset() {
    this.step = 'Welcome'
  }

  get isComplete() {
    return this.step === 'Complete'
  }

  get isRemaining() {
    return !this.isComplete
  }
}
