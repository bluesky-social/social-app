import {OnboardingModel} from '../models/discovery/onboarding'
import {SessionModel} from '../models/session'

export function shouldRequestEmailConfirmation(
  _session: SessionModel,
  _onboarding: OnboardingModel,
) {
  return false
}

export function setEmailConfirmationRequested() {}
