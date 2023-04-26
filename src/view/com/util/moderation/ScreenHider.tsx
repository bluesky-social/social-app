import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {NavigationProp} from 'lib/routes/types'
import {Text} from '../text/Text'
import {Button} from '../forms/Button'
import {isDesktopWeb} from 'platform/detection'

export function ScreenHider({
  testID,
  screenDescription,
  labels,
  style,
  containerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  screenDescription: string
  labels: ComAtprotoLabelDefs.Label[] | undefined
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const [override, setOverride] = React.useState(false)
  const store = useStores()
  const labelPref = store.preferences.getLabelPreference(labels)
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (labelPref.pref !== 'hide' || override) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  return (
    <View style={[styles.container, pal.view, containerStyle]}>
      <View style={styles.iconContainer}>
        <View style={[styles.icon, palInverted.view]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={pal.textInverted as FontAwesomeIconStyle}
            size={24}
          />
        </View>
      </View>
      <Text type="title-2xl" style={[styles.title, pal.text]}>
        Content Warning
      </Text>
      <Text type="2xl" style={[styles.description, pal.textLight]}>
        This {screenDescription} has been flagged for:{' '}
        {labelPref.desc.warning || labelPref.desc.title}
      </Text>
      {!isDesktopWeb && <View style={styles.spacer} />}
      <View style={styles.btnContainer}>
        <Button type="inverted" onPress={onPressBack} style={styles.btn}>
          <Text type="button-lg" style={pal.textInverted}>
            Go back
          </Text>
        </Button>
        <Button
          type="default"
          onPress={() => setOverride(v => !v)}
          style={styles.btn}>
          <Text type="button-lg" style={pal.text}>
            Show anyway
          </Text>
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  spacer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 150,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    marginBottom: 10,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 10,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
})
