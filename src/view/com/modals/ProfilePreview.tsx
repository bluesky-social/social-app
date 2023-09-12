import React, {useState, useEffect} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {ThemedText} from '../util/text/ThemedText'
import {useStores} from 'state/index'
import {ProfileModel} from 'state/models/content/profile'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {ProfileHeader} from '../profile/ProfileHeader'
import {InfoCircleIcon} from 'lib/icons'
import {useNavigationState} from '@react-navigation/native'
import {isIOS} from 'platform/detection'
import {s} from 'lib/styles'

export const snapPoints = [520, '100%']

export const Component = observer(function ProfilePreviewImpl({
  did,
}: {
  did: string
}) {
  const store = useStores()
  const pal = usePalette('default')
  const [model] = useState(new ProfileModel(store, {actor: did}))
  const {screen} = useAnalytics()

  // track the navigator state to detect if a page-load occurred
  const navState = useNavigationState(state => state)
  const [initNavState] = useState(navState)
  const isLoading = initNavState !== navState

  useEffect(() => {
    screen('Profile:Preview')
    model.setup()
  }, [model, screen])

  return (
    <View style={[pal.view, s.flex1]}>
      <View
        style={[
          styles.headerWrapper,
          isLoading && isIOS && styles.headerPositionAdjust,
        ]}>
        <ProfileHeader view={model} hideBackButton onRefreshAll={() => {}} />
      </View>
      <View style={[styles.hintWrapper, pal.view]}>
        <View style={styles.hint}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <InfoCircleIcon size={21} style={pal.textLight} />
              <ThemedText type="xl" fg="light">
                Swipe up to see more
              </ThemedText>
            </>
          )}
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  headerWrapper: {
    height: 440,
  },
  headerPositionAdjust: {
    // HACK align the header for the profilescreen transition -prf
    paddingTop: 23,
  },
  hintWrapper: {
    height: 80,
  },
  hint: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
})
