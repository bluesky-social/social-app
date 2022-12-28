import React from 'react'
import {Button, ScrollView, TouchableOpacity, View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {Text} from '../com/util/Text'
import {ThemeProvider, useTheme} from '../lib/ThemeContext'
import {PaletteColorName} from '../lib/ThemeContext'
import {usePalette} from '../lib/hooks/usePalette'

export const Debug = () => {
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>(
    'light',
  )
  const onToggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
  }
  const theme = useTheme()
  return (
    <ThemeProvider theme={colorScheme}>
      <View style={{flex: 1}}>
        <ViewHeader title="Debug panel" />
        <ScrollView style={{flex: 1, paddingHorizontal: 10}}>
          <Button onPress={onToggleColorScheme} title={colorScheme} />
          <Text style={theme.typography.h1}>Buttons</Text>
          <ButtonsView />
          <Text style={theme.typography.h1}>Palettes</Text>
          <PaletteView palette="default" />
          <PaletteView palette="primary" />
          <PaletteView palette="secondary" />
          <PaletteView palette="error" />
          <Text style={theme.typography.h1}>Typography</Text>
          <TypographyView />
          <View style={{height: 200}} />
        </ScrollView>
      </View>
    </ThemeProvider>
  )
}

function PaletteView({palette}: {palette: PaletteColorName}) {
  const theme = useTheme()
  const defaultPal = usePalette('default')
  const pal = usePalette(palette)
  return (
    <View
      style={[
        pal.view,
        pal.border,
        {
          padding: 10,
          marginBottom: 5,
        },
      ]}>
      <Text style={[theme.typography.body1, pal.text]}>{palette} colors</Text>
      <Text style={[theme.typography.body1, pal.textLight]}>Light text</Text>
      <Text style={[theme.typography.body1, pal.link]}>Link text</Text>
      {palette !== 'default' && (
        <View style={[defaultPal.view]}>
          <Text style={[theme.typography.body1, pal.textInverted]}>
            Inverted text
          </Text>
        </View>
      )}
    </View>
  )
}

function TypographyView() {
  const theme = useTheme()
  const pal = usePalette('default')
  return (
    <View
      style={[
        pal.view,
        pal.border,
        {
          marginBottom: 5,
          padding: 5,
        },
      ]}>
      <Text style={[theme.typography.h1, pal.text]}>Heading 1</Text>
      <Text style={[theme.typography.h2, pal.text]}>Heading 2</Text>
      <Text style={[theme.typography.h3, pal.text]}>Heading 3</Text>
      <Text style={[theme.typography.h4, pal.text]}>Heading 4</Text>
      <Text style={[theme.typography.subtitle1, pal.text]}>Subtitle 1</Text>
      <Text style={[theme.typography.subtitle2, pal.text]}>Subtitle 2</Text>
      <Text style={[theme.typography.body1, pal.text]}>Body 1</Text>
      <Text style={[theme.typography.body2, pal.text]}>Body 2</Text>
      <Text style={[theme.typography.button, pal.text]}>Button</Text>
      <Text style={[theme.typography.caption, pal.text]}>Caption</Text>
      <Text style={[theme.typography.overline, pal.text]}>Overline</Text>
    </View>
  )
}

function ButtonsView() {
  const theme = useTheme()
  const defaultPal = usePalette('default')
  const primaryPal = usePalette('primary')
  const secondaryPal = usePalette('secondary')
  const buttonStyles = {padding: 10, marginRight: 5}
  return (
    <View
      style={[
        defaultPal.view,
        defaultPal.border,
        {
          marginBottom: 5,
          padding: 5,
        },
      ]}>
      <View
        style={{
          flexDirection: 'row',
          marginBottom: 5,
        }}>
        <TouchableOpacity
          style={[theme.typography.button, primaryPal.view, buttonStyles]}>
          <Text style={[theme.typography.button, primaryPal.text]}>
            Primary solid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[theme.typography.button, secondaryPal.view, buttonStyles]}>
          <Text style={[theme.typography.button, secondaryPal.text]}>
            Secondary solid
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
        }}>
        <TouchableOpacity
          style={[
            theme.typography.button,
            {borderWidth: 1, borderColor: primaryPal.colors.background},
            buttonStyles,
          ]}>
          <Text style={[theme.typography.button, primaryPal.textInverted]}>
            Primary outline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            theme.typography.button,
            {borderWidth: 1, borderColor: secondaryPal.colors.background},
            buttonStyles,
          ]}>
          <Text style={[theme.typography.button, secondaryPal.textInverted]}>
            Primary outline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
