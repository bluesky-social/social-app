import Purchases from 'react-native-purchases'

import {SessionAccount} from '#/state/session/types'

export function identifyUser(account: SessionAccount) {
  Purchases.logIn(account.did)
  // TODO is this ever not defined?
  if (account.email) {
    Purchases.setEmail(account.email)
  }
}
