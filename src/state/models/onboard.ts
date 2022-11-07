import {makeAutoObservable} from 'mobx'
import {isObj, hasProp} from '../lib/type-guards'

export const OnboardStage = {
  Explainers: 'explainers',
  Follows: 'follows',
}

export const OnboardStageOrder = [OnboardStage.Explainers, OnboardStage.Follows]

export class OnboardModel {
  isOnboarding: boolean = true
  stage: string = OnboardStageOrder[0]

  constructor() {
    makeAutoObservable(this, {
      serialize: false,
      hydrate: false,
    })
  }

  serialize(): unknown {
    return {
      isOnboarding: this.isOnboarding,
      stage: this.stage,
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'isOnboarding') && typeof v.isOnboarding === 'boolean') {
        this.isOnboarding = v.isOnboarding
      }
      if (
        hasProp(v, 'stage') &&
        typeof v.stage === 'string' &&
        OnboardStageOrder.includes(v.stage)
      ) {
        this.stage = v.stage
      }
    }
  }

  start() {
    this.isOnboarding = true
  }

  stop() {
    this.isOnboarding = false
  }

  next() {
    if (!this.isOnboarding) return
    let i = OnboardStageOrder.indexOf(this.stage)
    i++
    if (i >= OnboardStageOrder.length) {
      this.isOnboarding = false
    } else {
      this.stage = OnboardStageOrder[i]
    }
  }
}
