import React from 'react'
import {View} from 'react-native'

import {useSetThemePrefs} from '#/state/shell'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Breakpoints} from './Breakpoints'
import {Buttons} from './Buttons'
import {Dialogs} from './Dialogs'
import {Forms} from './Forms'
import {Icons} from './Icons'
import {Links} from './Links'
import {Menus} from './Menus'
import {Shadows} from './Shadows'
import {Spacing} from './Spacing'
import {Theming} from './Theming'
import {Typography} from './Typography'

export function Storybook() {
  const t = useTheme()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()

  return (
    <ScrollView>
      <CenteredView style={[t.atoms.bg]}>
        <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 200}]}>
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

          <Dialogs />
          <ThemeProvider theme="light">
            <Theming />
          </ThemeProvider>
          <ThemeProvider theme="dim">
            <Theming />
          </ThemeProvider>
          <ThemeProvider theme="dark">
            <Theming />
          </ThemeProvider>

          <Typography />
          <Spacing />
          <Shadows />
          <Buttons />
          <Icons />
          <Links />
          <Forms />
          <Dialogs />
          <Menus />
          <Breakpoints />
        </View>
      </CenteredView>
    </ScrollView>
  )
}
