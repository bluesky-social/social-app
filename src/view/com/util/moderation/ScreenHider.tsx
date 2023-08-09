import React from 'react'
import {
  TouchableWithoutFeedback,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {ModerationUI} from '@atproto/api'
import {usePalette} from 'lib/hooks/usePalette'
import {NavigationProp} from 'lib/routes/types'
import {Text} from '../text/Text'
import {Button} from '../forms/Button'
import {isDesktopWeb} from 'platform/detection'
import {describeModerationCause} from 'lib/moderation'
import {useStores} from 'state/index'

export function ScreenHider({
  testID,
  screenDescription,
  moderation,
  style,
  containerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  screenDescription: string
  moderation: ModerationUI
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
}>) {
  const store = useStores()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const [override, setOverride] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()

  if (!moderation.blur || override) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  const desc = describeModerationCause(moderation.cause, 'account')
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
        This {screenDescription} has been flagged:{' '}
        <Text type="2xl-medium" style={pal.text}>
          {desc.name}
        </Text>
        .{' '}
        <TouchableWithoutFeedback
          onPress={() => {
            store.shell.openModal({
              name: 'moderation-details',
              context: 'account',
              moderation,
            })
          }}
          accessibilityRole="button"
          accessibilityLabel="Learn more about this warning"
          accessibilityHint="">
          <Text type="2xl" style={pal.link}>
            Learn More
          </Text>
        </TouchableWithoutFeedback>
      </Text>
      {!isDesktopWeb && <View style={styles.spacer} />}
      <View style={styles.btnContainer}>
        <Button
          type="inverted"
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              navigation.navigate('Home')
            }
          }}
          style={styles.btn}>
          <Text type="button-lg" style={pal.textInverted}>
            Go back
          </Text>
        </Button>
        {!moderation.noOverride && (
          <Button
            type="default"
            onPress={() => setOverride(v => !v)}
            style={styles.btn}>
            <Text type="button-lg" style={pal.text}>
              Show anyway
            </Text>
          </Button>
        )}
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
