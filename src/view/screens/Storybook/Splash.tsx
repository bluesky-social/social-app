import {useState} from 'react'
import {Modal, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {NativeSplashScreen} from '#/view/com/auth/NativeSplashScreen'
import {atoms as a, ThemeProvider, tokens, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {IS_IPAD} from '#/env'

const THEMES = ['light', 'dim', 'dark'] as const

export function Splash() {
  const t = useTheme()
  const [theme, setTheme] = useState<(typeof THEMES)[number]>()

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.font_bold, a.text_5xl]}>Native splash</Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        The logged-out landing screen from the native app, full screen. On web,
        resize the window to check it at every shape.
      </Text>
      <View style={[a.flex_row, a.gap_md]}>
        {THEMES.map(name => (
          <Button
            key={name}
            label={`Open the native splash in the ${name} theme`}
            size="small"
            color="secondary"
            onPress={() => setTheme(name)}>
            <ButtonText>{name}</ButtonText>
          </Button>
        ))}
      </View>

      <Modal
        visible={theme !== undefined}
        animationType="fade"
        supportedOrientations={
          IS_IPAD
            ? [
                'portrait',
                'portrait-upside-down',
                'landscape-left',
                'landscape-right',
              ]
            : ['portrait']
        }
        onRequestClose={() => setTheme(undefined)}>
        {theme && (
          <ThemeProvider theme={theme}>
            <SplashPreview onClose={() => setTheme(undefined)} />
          </ThemeProvider>
        )}
      </Modal>
    </View>
  )
}

/**
 * Mirrors the container that `LoggedOut` renders the splash in.
 */
function SplashPreview({onClose}: {onClose: () => void}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        a.flex_1,
        t.atoms.bg,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <Button
        label="Close the native splash preview"
        color="secondary_inverted"
        size="small"
        shape="round"
        style={[
          a.absolute,
          {
            top: insets.top + tokens.space.xl,
            right: tokens.space.xl,
            zIndex: 100,
          },
        ]}
        onPress={onClose}>
        <ButtonIcon icon={XIcon} />
      </Button>
      <NativeSplashScreen
        onPressSignin={() => {}}
        onPressCreateAccount={() => {}}
      />
    </View>
  )
}
