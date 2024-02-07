import React from 'react'
import {View} from 'react-native'
import {CenteredView, ScrollView} from '#/view/com/util/Views'

import {atoms as a, useTheme, ThemeProvider} from '#/alf'
import {useSetThemePrefs} from '#/state/shell'
import {Button} from '#/components/Button'

import {Theming} from './Theming'
import {Typography} from './Typography'
import {Spacing} from './Spacing'
import {Buttons} from './Buttons'
import {Links} from './Links'
import {Forms} from './Forms'
import {Dialogs} from './Dialogs'
import {Breakpoints} from './Breakpoints'
import {Shadows} from './Shadows'
import {Icons} from './Icons'

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
              System
            </Button>
            <Button
              variant="solid"
              color="secondary"
              size="small"
              label='Set theme to "light"'
              onPress={() => setColorMode('light')}>
              Light
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
              Dim
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
              Dark
            </Button>
          </View>

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
          <Breakpoints />
        </View>
      </CenteredView>
    </ScrollView>
  )
}
