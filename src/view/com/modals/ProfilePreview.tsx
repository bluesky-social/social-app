import React, {useState, useEffect, useCallback} from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useNavigation, StackActions} from '@react-navigation/native'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {ProfileModel} from 'state/models/content/profile'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {ProfileHeader} from '../profile/ProfileHeader'
import {Button} from '../util/forms/Button'
import {NavigationProp} from 'lib/routes/types'

export const snapPoints = [560]

export const Component = observer(({did}: {did: string}) => {
  const store = useStores()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const navigation = useNavigation<NavigationProp>()
  const [model] = useState(new ProfileModel(store, {actor: did}))
  const {screen} = useAnalytics()

  useEffect(() => {
    screen('Profile:Preview')
    model.setup()
  }, [model, screen])

  const onPressViewProfile = useCallback(() => {
    navigation.dispatch(StackActions.push('Profile', {name: model.handle}))
    store.shell.closeModal()
  }, [navigation, store, model])

  return (
    <View style={pal.view}>
      <View style={styles.headerWrapper}>
        <ProfileHeader view={model} hideBackButton onRefreshAll={() => {}} />
      </View>
      <View style={[styles.buttonsContainer, pal.view]}>
        <View style={styles.buttons}>
          <Button
            type="inverted"
            style={[styles.button, styles.buttonWide]}
            onPress={onPressViewProfile}
            accessibilityLabel="View profile"
            accessibilityHint="">
            <Text type="button-lg" style={palInverted.text}>
              View Profile
            </Text>
          </Button>
          <Button
            type="default"
            style={styles.button}
            onPress={() => store.shell.closeModal()}
            accessibilityLabel="Close this preview"
            accessibilityHint="">
            <Text type="button-lg" style={pal.text}>
              Close
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  headerWrapper: {
    height: 440,
  },
  buttonsContainer: {
    height: 120,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  button: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonWide: {
    flex: 3,
  },
})
