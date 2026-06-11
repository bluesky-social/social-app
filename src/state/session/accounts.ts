import {type SessionAccount} from './types'

let accountCycleOrder: string[] = []

export function getNextAccount(
  accounts: SessionAccount[],
  currentAccount: SessionAccount | undefined,
) {
  if (!currentAccount || accounts.length < 2) {
    return undefined
  }

  accountCycleOrder = reconcileAccountCycleOrder(
    accountCycleOrder,
    accounts.map(account => account.did),
  )

  const currentIndex = accountCycleOrder.indexOf(currentAccount.did)
  if (currentIndex === -1) {
    return accounts[0]
  }

  const nextDid =
    accountCycleOrder[(currentIndex + 1) % accountCycleOrder.length]
  return accounts.find(account => account.did === nextDid)
}

function reconcileAccountCycleOrder(
  previousOrder: string[],
  nextOrder: string[],
) {
  const nextDids = new Set(nextOrder)
  const preservedOrder = previousOrder.filter(did => nextDids.has(did))
  return [
    ...preservedOrder,
    ...nextOrder.filter(did => !preservedOrder.includes(did)),
  ]
}

export function resetAccountCycleOrderForTest() {
  accountCycleOrder = []
}
