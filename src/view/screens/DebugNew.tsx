import React from 'react'
import {View} from 'react-native'
import {CenteredView, ScrollView} from '#/view/com/util/Views'

import {useSetColorMode} from '#/state/shell'
import {useAlf, ThemeProvider as Alf} from '#/alf'
import {Button} from '#/view/com/Button'
import {Text, H1, H2, H3, H4, H5, H6} from '#/view/com/Typography'

function ThemeSelector() {
  const setColorMode = useSetColorMode()
  const {styles} = useAlf()

  return (
    <View style={[styles.flex.row, styles.flex.gap.m]}>
      <Button onPress={() => setColorMode('system')}>System</Button>
      <Button onPress={() => setColorMode('light')}>Light</Button>
      <Button onPress={() => setColorMode('dark')}>Dark</Button>
    </View>
  )
}

function BreakpointDebugger() {
  const {styles, breakpoints} = useAlf()

  return (
    <View>
      <H3 style={[styles.padding.pb.m]}>Breakpoint Debugger</H3>
      <Text style={[styles.padding.pb.m]}>
        Current breakpoint: {!breakpoints.gtMobile && <Text>mobile</Text>}
        {breakpoints.gtMobile && !breakpoints.gtTablet && <Text>tablet</Text>}
        {breakpoints.gtTablet && <Text>desktop</Text>}
      </Text>
      <Text
        style={[
          styles.padding.pa.m,
          styles.backgroundColor.l1,
          {fontFamily: 'monospace'},
        ]}>
        {JSON.stringify(breakpoints, null, 2)}
      </Text>
    </View>
  )
}

function ThemedSection() {
  const {styles} = useAlf()

  return (
    <View style={[styles.backgroundColor.l0, styles.padding.pa.m]}>
      <H3 style={[styles.padding.pb.m, styles.font.bold]}>
        Colors (this theme is always light)
      </H3>
      <View style={[styles.flex.row, styles.flex.gap.m]}>
        <View
          style={[styles.flex.one, styles.backgroundColor.l0, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l1, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l2, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l3, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l4, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l5, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l6, {height: 60}]}
        />
        <View
          style={[styles.flex.one, styles.backgroundColor.l7, {height: 60}]}
        />
      </View>
    </View>
  )
}

export function DebugScreen() {
  const {styles} = useAlf()

  return (
    <ScrollView>
      <CenteredView style={[styles.backgroundColor.l0]}>
        <View
          style={[
            styles.padding.pa.xl,
            styles.flex.gap.xxl,
            {paddingBottom: 200},
          ]}>
          <ThemeSelector />

          <BreakpointDebugger />

          <View>
            <H3 style={[styles.padding.pb.m, styles.font.bold]}>Colors</H3>
            <View style={[styles.flex.row, styles.flex.gap.m]}>
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l0,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l1,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l2,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l3,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l4,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l5,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l6,
                  {height: 60},
                ]}
              />
              <View
                style={[
                  styles.flex.one,
                  styles.backgroundColor.l7,
                  {height: 60},
                ]}
              />
            </View>
          </View>

          <View>
            <H3 style={[styles.padding.pb.m, styles.font.bold]}>Spacing</H3>

            <View style={[styles.flex.gap.m]}>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>xxs (2px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.xxs,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>xs (4px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.xs,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>s (8px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.s,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>m (12px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.m,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>l (18px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.l,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>xl (24px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.xl,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
              <View style={[styles.flex.row, styles.flex.alignCenter]}>
                <Text style={{width: 80}}>xxl (32px)</Text>
                <View
                  style={[
                    styles.flex.one,
                    styles.padding.pt.xxl,
                    styles.backgroundColor.l3,
                  ]}
                />
              </View>
            </View>
          </View>

          <View>
            <H3 style={[styles.padding.pb.m, styles.font.bold]}>Typography</H3>

            <View
              style={[
                styles.flex.gap.m,
                styles.padding.pa.m,
                styles.backgroundColor.l1,
              ]}>
              <H1>Heading 1</H1>
              <H2>Heading 2</H2>
              <H3>Heading 3</H3>
              <H4>Heading 4</H4>
              <H5>Heading 5</H5>
              <H6>Heading 6</H6>

              <Text style={[styles.font.xxl]}>H1 Size Text</Text>
              <Text style={[styles.font.xl]}>H2 Size Text</Text>
              <Text style={[styles.font.l]}>H3 Size Text</Text>
              <Text style={[styles.font.m]}>H4 Size Text</Text>
              <Text style={[styles.font.s]}>H5 Size Text</Text>
              <Text style={[styles.font.xs]}>H6 Size Text</Text>
              <Text style={[styles.font.xxs]}>Very Small Size Text</Text>
            </View>
          </View>

          <View>
            <H3 style={[styles.padding.pb.m, styles.font.bold]}>Breakpoints</H3>
          </View>

          <Alf theme="light">
            <ThemedSection />
          </Alf>
        </View>
      </CenteredView>
    </ScrollView>
  )
}
