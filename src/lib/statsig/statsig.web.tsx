import React from 'react'
import {StatsigProvider, useGate as useStatsigGate} from 'statsig-react'
import {useSession} from '../../state/session'
import {sha256} from 'js-sha256'

const statsigOptions = {
  environment: {
    tier: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  },
  // Don't block on waiting for network. The fetched config will kick in on next load.
  // This ensures the UI is always consistent and doesn't update mid-session.
  // Note this makes cold load (no local storage) and private mode return `false` for all gates.
  initTimeoutMs: 1,
}

export function useGate(gateName: string) {
  const {isLoading, value} = useStatsigGate(gateName)
  if (isLoading) {
    // This should not happen because of waitForInitialization={true}.
    console.error('Did not expected isLoading to ever be true.')
  }
  return value
}

function toStatsigUser(did: string | undefined) {
  let userID: string | undefined
  if (did) {
    userID = sha256(did)
  }
  return {userID}
}

export function Provider({children}: {children: React.ReactNode}) {
  const {currentAccount} = useSession()
  const currentStatsigUser = React.useMemo(
    () => toStatsigUser(currentAccount?.did),
    [currentAccount?.did],
  )
  return (
    <StatsigProvider
      sdkKey="client-SXJakO39w9vIhl3D44u8UupyzFl4oZ2qPIkjwcvuPsV"
      mountKey={currentStatsigUser.userID}
      user={currentStatsigUser}
      // This isn't really blocking due to short initTimeoutMs above.
      // However, it ensures `isLoading` is always `false`.
      waitForInitialization={true}
      options={statsigOptions}>
      {children}
    </StatsigProvider>
  )
}
