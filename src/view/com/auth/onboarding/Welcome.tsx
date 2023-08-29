import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Button} from 'view/com/util/forms/Button'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {HomeTabNavigatorParams} from 'lib/routes/types'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {HeaderButtonProps} from '@react-navigation/native-stack/lib/typescript/src/types'
import {NavigationProp, useNavigation} from '@react-navigation/native'

type Props = NativeStackScreenProps<HomeTabNavigatorParams, 'Welcome'>
export const Welcome = observer(({navigation}: Props) => {
  const pal = usePalette('default')
  const store = useStores()

  // make sure bottom nav is hidden
  React.useEffect(() => {
    if (!store.shell.minimalShellMode) {
      store.shell.setMinimalShellMode(true)
    }
  }, [store.shell.minimalShellMode, store])

  const next = () => {
    const nextScreenName = store.onboarding.next('Welcome')
    if (nextScreenName) {
      navigation.navigate(nextScreenName)
    }
  }

  return (
    <View style={[styles.container]}>
      <View testID="welcomeScreen">
        <Text style={[pal.text, styles.title]}>Welcome to </Text>
        <Text style={[pal.text, pal.link, styles.title]}>Bluesky</Text>

        <View style={styles.spacer} />

        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'globe'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is public.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Your posts, likes, and blocks are public. Mutes are private.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'at'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is open.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Never lose access to your followers and data.
            </Text>
          </View>
        </View>
        <View style={[styles.row]}>
          <FontAwesomeIcon icon={'gear'} size={36} color={pal.colors.link} />
          <View style={[styles.rowText]}>
            <Text type="lg-bold" style={[pal.text]}>
              Bluesky is flexible.
            </Text>
            <Text type="lg-thin" style={[pal.text, s.pt2]}>
              Choose the algorithms that power your experience with custom
              feeds.
            </Text>
          </View>
        </View>
      </View>

      <Button
        onPress={next}
        label="Continue"
        testID="continueBtn"
        labelStyle={styles.buttonText}
      />
    </View>
  )
})

export const WelcomeHeaderRight = (props: HeaderButtonProps) => {
  const {canGoBack} = props
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp<HomeTabNavigatorParams>>()
  const store = useStores()
  return (
    <Pressable
      accessibilityRole="button"
      style={[s.flexRow, s.alignCenter]}
      onPress={() => {
        if (canGoBack) {
          store.onboarding.skip()
          navigation.goBack()
        }
      }}>
      <Text style={[pal.link]}>Skip</Text>
      <FontAwesomeIcon
        icon={'chevron-right'}
        size={14}
        color={pal.colors.link}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 60,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    columnGap: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  rowText: {
    flex: 1,
  },
  spacer: {
    height: 20,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    marginVertical: 4,
  },
})
