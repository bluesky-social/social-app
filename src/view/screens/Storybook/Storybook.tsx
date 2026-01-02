import React from 'react'
import {View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useSetThemePrefs} from '#/state/shell'
import {ListContained} from '#/view/screens/Storybook/ListContained'
import {atoms as a, ThemeProvider} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  useDeviceGeolocationApi,
  useRequestDeviceGeolocation,
} from '#/geolocation'
import {Admonitions} from './Admonitions'
import {Breakpoints} from './Breakpoints'
import {Buttons} from './Buttons'
import {Dialogs} from './Dialogs'
import {Forms} from './Forms'
import {Icons} from './Icons'
import {Links} from './Links'
import {Menus} from './Menus'
import {Settings} from './Settings'
import {Shadows} from './Shadows'
import {Spacing} from './Spacing'
import {Theming} from './Theming'
import {Toasts} from './Toasts'
import {Typography} from './Typography'

export default function Storybook() {
  const {setColorMode, setDarkTheme} = useSetThemePrefs()
  const [showContainedList, setShowContainedList] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()
  const requestDeviceGeolocation = useRequestDeviceGeolocation()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()

  return (
    <>
      <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 100}]}>
        {!showContainedList ? (
          <>
            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <Button
                color="primary"
                size="small"
                label='Set theme to "system"'
                onPress={() => setColorMode('system')}>
                <ButtonText>System</ButtonText>
              </Button>
              <Button
                color="secondary"
                size="small"
                label='Set theme to "light"'
                onPress={() => setColorMode('light')}>
                <ButtonText>Light</ButtonText>
              </Button>
              <Button
                color="secondary"
                size="small"
                label='Set theme to "dim"'
                onPress={() => {
                  setColorMode('dark')
                  setDarkTheme('dim')
                }}>
                <ButtonText>Dim</ButtonText>
              </Button>
              <Button
                color="secondary"
                size="small"
                label='Set theme to "dark"'
                onPress={() => {
                  setColorMode('dark')
                  setDarkTheme('dark')
                }}>
                <ButtonText>Dark</ButtonText>
              </Button>
            </View>

            <Button
              color="primary"
              size="small"
              onPress={() => navigation.navigate('SharedPreferencesTester')}
              label="two"
              testID="sharedPrefsTestOpenBtn">
              <ButtonText>Open Shared Prefs Tester</ButtonText>
            </Button>
            <Button
              color="primary_subtle"
              size="large"
              onPress={() =>
                requestDeviceGeolocation().then(req => {
                  if (req.granted && req.location) {
                    setDeviceGeolocation(req.location)
                  }
                })
              }
              label="crash">
              <ButtonText>Get GPS Location</ButtonText>
            </Button>

            <ThemeProvider theme="light">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dim">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dark">
              <Theming />
            </ThemeProvider>

            <Toasts />
            <Buttons />
            <Forms />
            <Typography />
            <Spacing />
            <Shadows />
            <Icons />
            <Links />
            <Dialogs />
            <Menus />
            <Breakpoints />
            <Dialogs />
            <Admonitions />
            <Settings />

            <Button
              color="primary"
              size="large"
              label="Switch to Contained List"
              onPress={() => setShowContainedList(true)}>
              <ButtonText>Switch to Contained List</ButtonText>
            </Button>
          </>
        ) : (
          <>
            <Button
              color="primary"
              size="large"
              label="Switch to Storybook"
              onPress={() => setShowContainedList(false)}>
              <ButtonText>Switch to Storybook</ButtonText>
            </Button>
            <ListContained />
          </>
        )}
      </View>
    </>
  )
}
