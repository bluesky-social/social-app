import React from 'react'
import {View} from 'react-native'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {useSetColorMode} from '#/state/shell'
import {atoms, useTheme, useBreakpoints, ThemeProvider as Alf} from '#/alf'
import {Button, ButtonText} from '#/view/com/Button'
import {Text, H1, H2, H3, H4, H5, H6} from '#/view/com/Typography'

function ThemeSelector() {
  const setColorMode = useSetColorMode()

  return (
    <View style={[atoms.flex.row, atoms.flex.gap.m]}>
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
      <H3 style={[atoms.padding.pb.m]}>Breakpoint Debugger</H3>
      <Text style={[atoms.padding.pb.m]}>
        Current breakpoint: {!breakpoints.gtMobile && <Text>mobile</Text>}
        {breakpoints.gtMobile && !breakpoints.gtTablet && <Text>tablet</Text>}
        {breakpoints.gtTablet && <Text>desktop</Text>}
      </Text>
      <Text
        style={[
          atoms.padding.pa.m,
          t.atoms.backgroundColor.l1,
          {fontFamily: 'monospace'},
        ]}>
        {JSON.stringify(breakpoints, null, 2)}
      </Text>
    </View>
  )
}

function ThemedSection() {
  const t = useTheme()

  return (
    <View style={[t.atoms.backgroundColor.l0, atoms.padding.pa.m]}>
      <H3 style={[atoms.padding.pb.m, atoms.font.bold]}>
        Colors (this theme is always light)
      </H3>
      <View style={[atoms.flex.row, atoms.flex.gap.m]}>
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l0, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l1, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l2, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l3, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l4, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l5, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l6, {height: 60}]}
        />
        <View
          style={[atoms.flex.one, t.atoms.backgroundColor.l7, {height: 60}]}
        />
      </View>
    </View>
  )
}

export function DebugScreen() {
  const t = useTheme()

  return (
    <ScrollView>
      <CenteredView style={[t.atoms.backgroundColor.l0]}>
        <View
          style={[
            atoms.padding.pa.xl,
            atoms.flex.gap.xxl,
            {paddingBottom: 200},
          ]}>
          <ThemeSelector />

          <BreakpointDebugger />

          <View>
            <H3 style={[atoms.padding.pb.m, atoms.font.bold]}>Colors</H3>
            <View style={[atoms.flex.row, atoms.flex.gap.m]}>
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l0,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l1,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l2,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l3,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l4,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l5,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l6,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  atoms.flex.one,
                  t.atoms.backgroundColor.l7,
                  {height: 60},
                ]}
              />
            </View>
          </View>

          <View>
            <H3 style={[atoms.padding.pb.m, atoms.font.bold]}>Spacing</H3>

            <View style={[atoms.flex.gap.m]}>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>xxs (2px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.xxs,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>xs (4px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.xs,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>s (8px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.s,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>m (12px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.m,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>l (18px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.l,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>xl (24px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.xl,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[atoms.flex.row, atoms.flex.alignCenter]}>
                <Text style={{width: 80}}>xxl (32px)</Text>
                <View
                  style={[
                    atoms.flex.one,
                    atoms.padding.pt.xxl,
                    t.atoms.backgroundColor.l3,
                  ]}
                />
              </View>
            </View>
          </View>

          <View>
            <H3 style={[atoms.padding.pb.m, atoms.font.bold]}>Typography</H3>

            <View
              style={[
                atoms.flex.gap.m,
                atoms.padding.pa.m,
                t.atoms.backgroundColor.l1,
              ]}>
              <H1>Heading 1</H1>
              <H2>Heading 2</H2>
              <H3>Heading 3</H3>
              <H4>Heading 4</H4>
              <H5>Heading 5</H5>
              <H6>Heading 6</H6>

              <Text style={[atoms.font.xxl]}>H1 Size Text</Text>
              <Text style={[atoms.font.xl]}>H2 Size Text</Text>
              <Text style={[atoms.font.l]}>H3 Size Text</Text>
              <Text style={[atoms.font.m]}>H4 Size Text</Text>
              <Text style={[atoms.font.s]}>H5 Size Text</Text>
              <Text style={[atoms.font.xs]}>H6 Size Text</Text>
              <Text style={[atoms.font.xxs]}>Very Small Size Text</Text>
            </View>
          </View>

          <View>
            <H3 style={[atoms.padding.pb.m, atoms.font.bold]}>Breakpoints</H3>
          </View>

          <Alf theme="light">
            <ThemedSection />
          </Alf>

          <View style={[atoms.flex.gap.m, atoms.flex.alignStart]}>
            <H3 style={[atoms.padding.pb.m, atoms.font.bold]}>Buttons</H3>

            <Button>
              {({state}) => (
                <View
                  style={[
                    atoms.padding.pa.m,
                    atoms.radius.round,
                    t.atoms.backgroundColor.l2,
                  ]}>
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
