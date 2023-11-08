import {SessionModel} from '../models/session'

export function shouldRequestEmailConfirmation(_session: SessionModel) {
  return false
}

export function setEmailConfirmationRequested() {}
