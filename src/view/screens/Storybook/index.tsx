import React from 'react'
import {ScrollView, View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import {useSetThemePrefs} from '#/state/shell'
import {CenteredView} from '#/view/com/util/Views'
import {ListContained} from '#/view/screens/Storybook/ListContained'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
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
import {Typography} from './Typography'

export function Storybook() {
  return (
    <Layout.Screen>
      {isWeb ? (
        <StorybookInner />
      ) : (
        <ScrollView>
          <StorybookInner />
        </ScrollView>
      )}
    </Layout.Screen>
  )
}

function StorybookInner() {
  const t = useTheme()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()
  const [showContainedList, setShowContainedList] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()

  return (
    <CenteredView style={[t.atoms.bg]}>
      <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 100}]}>
        {!showContainedList ? (
          <>
            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <Button
                variant="outline"
                color="primary"
                size="small"
                label='Set theme to "system"'
                onPress={() => setColorMode('system')}>
                <ButtonText>System</ButtonText>
              </Button>
              <Button
                variant="solid"
                color="secondary"
                size="small"
                label='Set theme to "light"'
                onPress={() => setColorMode('light')}>
                <ButtonText>Light</ButtonText>
              </Button>
              <Button
                variant="solid"
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
                variant="solid"
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
              variant="solid"
              color="primary"
              size="small"
              onPress={() => navigation.navigate('SharedPreferencesTester')}
              label="two"
              testID="sharedPrefsTestOpenBtn">
              <ButtonText>Open Shared Prefs Tester</ButtonText>
            </Button>

            <Admonitions />

            <Settings />

            <ThemeProvider theme="light">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dim">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dark">
              <Theming />
            </ThemeProvider>

            <Forms />
            <Buttons />
            <Typography />
            <Spacing />
            <Shadows />
            <Buttons />
            <Icons />
            <Links />
            <Dialogs />
            <Menus />
            <Breakpoints />
            <Dialogs />

            <Button
              variant="solid"
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
              variant="solid"
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
    </CenteredView>
  )
}
