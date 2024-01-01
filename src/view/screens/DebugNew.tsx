import React from 'react'
import {View} from 'react-native'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {useSetColorMode} from '#/state/shell'
import {atoms as a, useTheme, useBreakpoints, ThemeProvider as Alf} from '#/alf'
import {Button, ButtonText} from '#/view/com/Button'
import {Text, H1, H2, H3, H4, H5, H6} from '#/view/com/Typography'

function ThemeSelector() {
  const setColorMode = useSetColorMode()

  return (
    <View style={[a.flex_row, a.gap_md]}>
      <Button
        type="secondary"
        size="small"
        onPress={() => setColorMode('system')}>
        System
      </Button>
      <Button
        type="secondary"
        size="small"
        onPress={() => setColorMode('light')}>
        Light
      </Button>
      <Button
        type="secondary"
        size="small"
        onPress={() => setColorMode('dark')}>
        Dark
      </Button>
    </View>
  )
}

function BreakpointDebugger() {
  const t = useTheme()
  const breakpoints = useBreakpoints()

  return (
    <View>
      <H3 style={[a.pb_md]}>Breakpoint Debugger</H3>
      <Text style={[a.pb_md]}>
        Current breakpoint: {!breakpoints.gtMobile && <Text>mobile</Text>}
        {breakpoints.gtMobile && !breakpoints.gtTablet && <Text>tablet</Text>}
        {breakpoints.gtTablet && <Text>desktop</Text>}
      </Text>
      <Text
        style={[a.p_md, t.atoms.bg_contrast_100, {fontFamily: 'monospace'}]}>
        {JSON.stringify(breakpoints, null, 2)}
      </Text>
    </View>
  )
}

function ThemedSection() {
  const t = useTheme()

  return (
    <View style={[t.atoms.bg, a.p_md]}>
      <H3 style={[a.pb_md, a.font_bold]}>
        Colors (this theme is always light)
      </H3>
      <View style={[a.flex_row, a.gap_md]}>
        <View style={[a.flex_1, t.atoms.bg, {height: 60}]} />
        <View style={[a.flex_1, t.atoms.bg_contrast_100, {height: 60}]} />
      </View>
    </View>
  )
}

export function DebugScreen() {
  const t = useTheme()

  return (
    <ScrollView>
      <CenteredView style={[t.atoms.bg]}>
        <View style={[a.p_xl, a.gap_xxl, {paddingBottom: 200}]}>
          <ThemeSelector />

          <BreakpointDebugger />

          <View>
            <H3 style={[a.pb_md, a.font_bold]}>Colors</H3>
            <View style={[a.flex_row, a.gap_md]}>
              <View style={[a.flex_1, t.atoms.bg, {height: 60}]} />
            </View>
          </View>

          <View>
            <H3 style={[a.pb_md, a.font_bold]}>Spacing</H3>

            <View style={[a.gap_md]}>
              <View style={[a.flex_row, a.text_center]}>
                <Text style={{width: 80}}>xxs (2px)</Text>
                <View style={[a.flex_1, a.pt_xxs, t.atoms.bg_contrast_300]} />
              </View>
            </View>
          </View>

          <View>
            <H3 style={[a.p_md, a.font_bold]}>Typography</H3>

            <View style={[a.gap_md, a.p_md, t.atoms.bg_contrast_100]}>
              <H1>Heading 1</H1>
              <H2>Heading 2</H2>
              <H3>Heading 3</H3>
              <H4>Heading 4</H4>
              <H5>Heading 5</H5>
              <H6>Heading 6</H6>

              <Text style={[a.text_xxl]}>H1 Size Text</Text>
              <Text style={[a.text_xl]}>H2 Size Text</Text>
              <Text style={[a.text_lg]}>H3 Size Text</Text>
              <Text style={[a.text_md]}>H4 Size Text</Text>
              <Text style={[a.text_sm]}>H5 Size Text</Text>
              <Text style={[a.text_xs]}>H6 Size Text</Text>
              <Text style={[a.text_xxs]}>Very Small Size Text</Text>
            </View>
          </View>

          <Alf theme="light">
            <ThemedSection />
          </Alf>

          <View style={[a.gap_md, a.align_start]}>
            <H3 style={[a.pb_md, a.font_bold]}>Buttons</H3>

            <Button>
              {({state}) => (
                <View style={[a.p_md, a.rounded_full, t.atoms.bg_contrast_300]}>
                  <Text>Unstyled button, state: {JSON.stringify(state)}</Text>
                </View>
              )}
            </Button>

            <Button type="primary" size="small">
              Button
            </Button>
            <Button type="secondary" size="small">
              Button
            </Button>

            <Button type="primary" size="large">
              Button
            </Button>
            <Button type="secondary" size="large">
              Button
            </Button>

            <Button type="secondary" size="small">
              {({type, size}) => (
                <>
                  <FontAwesomeIcon icon={['fas', 'plus']} size={12} />
                  <ButtonText type={type} size={size}>
                    With an icon
                  </ButtonText>
                </>
              )}
            </Button>
            <Button type="primary" size="large">
              {({state: _state, ...rest}) => (
                <>
                  <FontAwesomeIcon icon={['fas', 'plus']} />
                  <ButtonText {...rest}>With an icon</ButtonText>
                </>
              )}
            </Button>
          </View>
        </View>
      </CenteredView>
    </ScrollView>
  )
}
