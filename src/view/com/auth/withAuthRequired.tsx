import React from 'react'
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {CenteredView} from '../util/Views'
import {LoggedOut} from './LoggedOut'
import {Onboarding} from './Onboarding'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {STATUS_PAGE_URL} from 'lib/constants'
import {useOnboardingState} from '#/state/shell'
import {useSession} from '#/state/session'

export const withAuthRequired = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> =>
  observer(function AuthRequired(props: P) {
    const {isInitialLoad, hasSession} = useSession()
    const onboardingState = useOnboardingState()
    if (isInitialLoad) {
      return <Loading />
    }
    if (!hasSession) {
      return <LoggedOut />
    }
    if (onboardingState.isActive) {
      return <Onboarding />
    }
    return <Component {...props} />
  })

function Loading() {
  const pal = usePalette('default')

  const [isTakingTooLong, setIsTakingTooLong] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setIsTakingTooLong(true), 15e3) // 15 seconds
    return () => clearTimeout(t)
  }, [setIsTakingTooLong])

  return (
    <CenteredView style={[styles.loading, pal.view]}>
      <ActivityIndicator size="large" />
      <Text type="2xl" style={[styles.loadingText, pal.textLight]}>
        {isTakingTooLong
          ? "This is taking too long. There may be a problem with your internet or with the service, but we're going to try a couple more times..."
          : 'Connecting...'}
      </Text>
      {isTakingTooLong ? (
        <TouchableOpacity
          onPress={() => {
            Linking.openURL(STATUS_PAGE_URL)
          }}
          accessibilityRole="button">
          <Text type="2xl" style={[styles.loadingText, pal.link]}>
            Check Bluesky status page
          </Text>
        </TouchableOpacity>
      ) : null}
    </CenteredView>
  )
}

const styles = StyleSheet.create({
  loading: {
    height: '100%',
    alignContent: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
})
