import React from 'react'
import {StatsigProvider} from 'statsig-react-native-expo'
import {useSession} from '../../state/session'
import {sha256} from 'js-sha256'

export function Provider({children}: {children: React.ReactNode}) {
  const {currentAccount} = useSession()
  const statsigUser = React.useMemo(() => {
    let userID
    if (currentAccount?.did) {
      userID = sha256(currentAccount?.did)
    }
    return {userID}
  }, [currentAccount?.did])
  return (
    <StatsigProvider
      sdkKey="client-SXJakO39w9vIhl3D44u8UupyzFl4oZ2qPIkjwcvuPsV"
      mountKey={statsigUser.userID}
      user={statsigUser}
      waitForInitialization={true}
      options={{
        disableLocalStorage: true,
        environment: {
          tier:
            process.env.NODE_ENV === 'development'
              ? 'development'
              : 'production',
        },
      }}>
      {children}
    </StatsigProvider>
  )
}
