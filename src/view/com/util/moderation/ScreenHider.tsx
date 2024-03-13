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
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {Text} from '../text/Text'
import {Button} from '../forms/Button'
import {describeModerationCause} from 'lib/moderation'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {s} from '#/lib/styles'
import {CenteredView} from '../Views'

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
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()
  const {isMobile} = useWebMediaQueries()
  const {openModal} = useModalControls()

  if (!moderation.blur || override) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  const isNoPwi =
    moderation.cause?.type === 'label' &&
    moderation.cause?.labelDef.id === '!no-unauthenticated'
  const desc = describeModerationCause(moderation.cause, 'account')
  return (
    <CenteredView
      style={[styles.container, pal.view, containerStyle]}
      sideBorders>
      <View style={styles.iconContainer}>
        <View style={[styles.icon, palInverted.view]}>
          <FontAwesomeIcon
            icon={isNoPwi ? ['far', 'eye-slash'] : 'exclamation'}
            style={pal.textInverted as FontAwesomeIconStyle}
            size={24}
          />
        </View>
      </View>
      <Text type="title-2xl" style={[styles.title, pal.text]}>
        {isNoPwi ? (
          <Trans>Sign-in Required</Trans>
        ) : (
          <Trans>Content Warning</Trans>
        )}
      </Text>
      <Text type="2xl" style={[styles.description, pal.textLight]}>
        {isNoPwi ? (
          <Trans>
            This account has requested that users sign in to view their profile.
          </Trans>
        ) : (
          <>
            <Trans>This {screenDescription} has been flagged:</Trans>
            <Text type="2xl-medium" style={[pal.text, s.ml5]}>
              {desc.name}.
            </Text>
            <TouchableWithoutFeedback
              onPress={() => {
                openModal({
                  name: 'moderation-details',
                  context: 'account',
                  moderation,
                })
              }}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Learn more about this warning`)}
              accessibilityHint="">
              <Text type="2xl" style={pal.link}>
                <Trans>Learn More</Trans>
              </Text>
            </TouchableWithoutFeedback>
          </>
        )}{' '}
      </Text>
      {isMobile && <View style={styles.spacer} />}
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
            <Trans>Go back</Trans>
          </Text>
        </Button>
        {!moderation.noOverride && (
          <Button
            type="default"
            onPress={() => setOverride(v => !v)}
            style={styles.btn}>
            <Text type="button-lg" style={pal.text}>
              <Trans>Show anyway</Trans>
            </Text>
          </Button>
        )}
      </View>
    </CenteredView>
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
