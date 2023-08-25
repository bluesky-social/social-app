import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {NavigationProp} from 'lib/routes/types'
import {hasProp} from 'lib/type-guards'

enum OnboardingStep {
  WELCOME = 'WELCOME',
  BROWSE_FEEDS = 'BROWSE_FEEDS',
  COMPLETE = 'COMPLETE',
}

export class OnboardingModel {
  // state
  step: OnboardingStep

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false})
    this.step = OnboardingStep.WELCOME
  }

  serialize() {
    return {
      step: this.step,
    }
  }

  hydrate(v: unknown) {
    if (typeof v === 'object' && v !== null) {
      if (hasProp(v, 'step') && typeof v.step === 'string') {
        this.step = v.step as OnboardingStep
      }
    }
  }

  nextStep(navigation?: NavigationProp) {
    switch (this.step) {
      case OnboardingStep.WELCOME:
        this.step = OnboardingStep.COMPLETE
        break
      case OnboardingStep.BROWSE_FEEDS:
        this.step = OnboardingStep.COMPLETE
        break
      case OnboardingStep.COMPLETE:
        if (!navigation) {
          throw new Error('Navigation prop required to complete onboarding')
        }
        this.complete(navigation)
        break
    }
  }

  complete(navigation: NavigationProp) {
    navigation.navigate('Home')
  }

  reset() {
    this.step = OnboardingStep.WELCOME
  }

  get isComplete() {
    return this.step === OnboardingStep.COMPLETE
  }
}
