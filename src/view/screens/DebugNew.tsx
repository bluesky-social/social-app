import React from 'react'
import {View} from 'react-native'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {useSetColorMode} from '#/state/shell'
import * as tokens from '#/alf/tokens'
import {atoms as a, useTheme, useBreakpoints, ThemeProvider as Alf} from '#/alf'
import {Button, ButtonText} from '#/view/com/Button'
import {Link} from '#/view/com/Link'
import {Text, H1, H2, H3, H4, H5, H6} from '#/view/com/Typography'
import {InputText} from '#/view/com/forms/InputText'
import {InputDate, utils} from '#/view/com/forms/InputDate'
import {Logo} from '#/view/icons/Logo'

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
    <View style={[t.atoms.bg, a.gap_md, a.p_xl]}>
      <H3 style={[a.font_bold]}>theme.atoms.text</H3>
      <View style={[a.flex_1, t.atoms.border, a.border_t]} />
      <H3 style={[a.font_bold, t.atoms.text_contrast_700]}>
        theme.atoms.text_contrast_700
      </H3>
      <View style={[a.flex_1, t.atoms.border, a.border_t]} />
      <H3 style={[a.font_bold, t.atoms.text_contrast_500]}>
        theme.atoms.text_contrast_500
      </H3>
      <View style={[a.flex_1, t.atoms.border_contrast_500, a.border_t]} />

      <View style={[a.flex_row, a.gap_md]}>
        <View
          style={[
            a.flex_1,
            t.atoms.bg,
            a.align_center,
            a.justify_center,
            {height: 60},
          ]}>
          <Text>theme.bg</Text>
        </View>
        <View
          style={[
            a.flex_1,
            t.atoms.bg_contrast_100,
            a.align_center,
            a.justify_center,
            {height: 60},
          ]}>
          <Text>theme.bg_contrast_100</Text>
        </View>
      </View>
      <View style={[a.flex_row, a.gap_md]}>
        <View
          style={[
            a.flex_1,
            t.atoms.bg_contrast_200,
            a.align_center,
            a.justify_center,
            {height: 60},
          ]}>
          <Text>theme.bg_contrast_200</Text>
        </View>
        <View
          style={[
            a.flex_1,
            t.atoms.bg_contrast_300,
            a.align_center,
            a.justify_center,
            {height: 60},
          ]}>
          <Text>theme.bg_contrast_300</Text>
        </View>
      </View>
      <View style={[a.flex_row, a.gap_md]}>
        <View
          style={[
            a.flex_1,
            t.atoms.bg_positive,
            a.align_center,
            a.justify_center,
            {height: 60},
          ]}>
          <Text>theme.bg_positive</Text>
        </View>
        <View
          style={[
            a.flex_1,
            t.atoms.bg_negative,
            a.align_center,
            a.justify_center,
            {height: 60},
          ]}>
          <Text>theme.bg_negative</Text>
        </View>
      </View>
    </View>
  )
}

export function Buttons() {
  const t = useTheme()

  return (
    <View style={[a.gap_md, a.align_start]}>
      <Button>Unstyled button</Button>

      <Button>
        {({state}) => (
          <View style={[a.p_md, a.rounded_full, t.atoms.bg_contrast_300]}>
            <Text>Entirely custom button, state: {JSON.stringify(state)}</Text>
          </View>
        )}
      </Button>

      <Button type="primary" size="large">
        Default button
      </Button>

      <Button type="primary" size="large" disabled>
        Default button (disabled)
      </Button>

      <Button type="primary" size="large">
        {({props}) => (
          <>
            <FontAwesomeIcon icon={['fas', 'plus']} size={12} />
            <ButtonText {...props}>Default with an icon</ButtonText>
          </>
        )}
      </Button>

      <Button type="secondary" size="small">
        Small button
      </Button>

      <Button type="secondary" size="small" disabled>
        Small button (disabled)
      </Button>

      <Link
        to="https://blueskyweb.xyz"
        warnOnMismatchingTextChild
        style={[a.text_md]}>
        External
      </Link>
      <Link to="https://blueskyweb.xyz" style={[a.text_md]}>
        <H3>External with custom children</H3>
      </Link>
      <Link
        to="https://blueskyweb.xyz"
        warnOnMismatchingTextChild
        style={[a.text_md]}>
        https://blueskyweb.xyz
      </Link>
      <Link
        to="https://bsky.app/profile/bsky.app"
        warnOnMismatchingTextChild
        style={[a.text_md]}>
        Internal
      </Link>

      <Link type="primary" size="large" to="https://bsky.app/profile/bsky.app">
        {({props}) => <ButtonText {...props}>Link as a button</ButtonText>}
      </Link>
    </View>
  )
}

function Forms() {
  return (
    <View style={[a.gap_md, a.align_start]}>
      <InputText
        testID="input"
        accessibilityLabel="Input"
        accessibilityHint="Enter some text"
        placeholder="Type here"
        value=""
        onChange={text => console.log(text)}
      />
      <InputText
        hasError
        testID="input"
        accessibilityLabel="Input"
        accessibilityHint="Enter some text"
        placeholder="Type here"
        value="Test initial value"
        onChange={text => console.log(text)}
      />
      <InputText
        testID="input"
        accessibilityLabel="Input"
        accessibilityHint="Enter some text"
        placeholder="Type here"
        value=""
        onChange={text => console.log(text)}
        icon={Logo}
      />
      <InputText
        testID="input"
        accessibilityLabel="Input"
        accessibilityHint="Enter some text"
        placeholder="Type here"
        value=""
        onChange={text => console.log(text)}
        icon={Logo}
        suffix={() => <Text>.bksy.social</Text>}
      />

      <InputDate
        testID="date"
        value={'2001-01-01'}
        onChange={date => console.log(date)}
        accessibilityLabel="Date"
        accessibilityHint="Enter a date"
      />
      <InputDate
        testID="date"
        value={utils.toSimpleDateString(new Date())}
        onChange={date => console.log(date)}
        accessibilityLabel="Date"
        accessibilityHint="Enter a date"
      />
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

          <Forms />
          <Buttons />

          <Alf theme="light">
            <ThemedSection />
          </Alf>
          <Alf theme="dark">
            <ThemedSection />
          </Alf>

          <H1>Heading 1</H1>
          <H2>Heading 2</H2>
          <H3>Heading 3</H3>
          <H4>Heading 4</H4>
          <H5>Heading 5</H5>
          <H6>Heading 6</H6>

          <Text style={[a.text_xxl]}>atoms.text_xxl</Text>
          <Text style={[a.text_xl]}>atoms.text_xl</Text>
          <Text style={[a.text_lg]}>atoms.text_lg</Text>
          <Text style={[a.text_md]}>atoms.text_md</Text>
          <Text style={[a.text_sm]}>atoms.text_sm</Text>
          <Text style={[a.text_xs]}>atoms.text_xs</Text>
          <Text style={[a.text_xxs]}>atoms.text_xxs</Text>

          <View style={[a.gap_md]}>
            <View style={[a.flex_row, a.gap_md]}>
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_0},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_100},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_200},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_300},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_400},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_500},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_600},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_700},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_800},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_900},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.gray_1000},
                ]}
              />
            </View>

            <View style={[a.flex_row, a.gap_md]}>
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_0},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_100},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_200},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_300},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_400},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_500},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_600},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_700},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_800},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_900},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.blue_1000},
                ]}
              />
            </View>
            <View style={[a.flex_row, a.gap_md]}>
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_0},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_100},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_200},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_300},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_400},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_500},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_600},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_700},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_800},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_900},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.green_1000},
                ]}
              />
            </View>
            <View style={[a.flex_row, a.gap_md]}>
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_0},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_100},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_200},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_300},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_400},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_500},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_600},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_700},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_800},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_900},
                ]}
              />
              <View
                style={[
                  a.flex_1,
                  {height: 60, backgroundColor: tokens.color.red_1000},
                ]}
              />
            </View>
          </View>

          <View>
            <H3 style={[a.pb_md, a.font_bold]}>Spacing</H3>

            <View style={[a.gap_md]}>
              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>xxs (2px)</Text>
                <View style={[a.flex_1, a.pt_xxs, t.atoms.bg_contrast_300]} />
              </View>

              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>xs (4px)</Text>
                <View style={[a.flex_1, a.pt_xs, t.atoms.bg_contrast_300]} />
              </View>

              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>sm (8px)</Text>
                <View style={[a.flex_1, a.pt_sm, t.atoms.bg_contrast_300]} />
              </View>

              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>md (12px)</Text>
                <View style={[a.flex_1, a.pt_md, t.atoms.bg_contrast_300]} />
              </View>

              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>lg (18px)</Text>
                <View style={[a.flex_1, a.pt_lg, t.atoms.bg_contrast_300]} />
              </View>

              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>xl (24px)</Text>
                <View style={[a.flex_1, a.pt_xl, t.atoms.bg_contrast_300]} />
              </View>

              <View style={[a.flex_row, a.align_center]}>
                <Text style={{width: 80}}>xxl (32px)</Text>
                <View style={[a.flex_1, a.pt_xxl, t.atoms.bg_contrast_300]} />
              </View>
            </View>
          </View>

          <BreakpointDebugger />
        </View>
      </CenteredView>
    </ScrollView>
  )
}
