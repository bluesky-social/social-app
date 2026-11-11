import 'react-native-gesture-handler'

import {View} from 'react-native'
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import {registerRootComponent} from 'expo'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import {Provider as MinimalModeProvider} from '#/state/shell/minimal-mode'
import {DuoRightRailContext} from '#/view/shell/duoFoldedNavigation'
import {ThemeProvider} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {SettingsGear2_Stroke2_Corner0_Rounded as GearIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

const Stack = createNativeStackNavigator()
const i18n = setupI18n({locale: 'en', messages: {en: {}}})
const samples = [
  {title: 'Notifications', actions: ['gear']},
  {title: 'Chats', actions: ['inbox', 'gear']},
  {title: 'Settings', actions: []},
  {
    title: 'A long profile name',
    subtitle: '@example.test',
    actions: ['Edit Profile', 'share', 'more'],
  },
  {title: 'Search', actions: ['filter', 'share']},
  {title: 'Privacy and security settings', actions: []},
]

/** Actual shared headers with synthetic labels, no sessions or network clients. */
function Samples() {
  return (
    <View style={{flex: 1, backgroundColor: '#0b0f15'}}>
      <View style={{width: 466}}>
        {samples.map(sample => (
          <View
            key={sample.title}
            style={{
              width: 466,
              height: 150,
              borderBottomWidth: 1,
              borderColor: '#586477',
            }}>
            <View style={{width: 402}}>
              <Layout.Screen style={{height: 150}}>
                <Layout.Header.Outer>
                  <Layout.Header.BackButton />
                  <Layout.Header.Content align="left">
                    <Layout.Header.TitleText>
                      {sample.title}
                    </Layout.Header.TitleText>
                    {sample.subtitle && (
                      <Layout.Header.SubtitleText>
                        {sample.subtitle}
                      </Layout.Header.SubtitleText>
                    )}
                  </Layout.Header.Content>
                  <View style={{flexDirection: 'row', gap: 8}}>
                    {sample.actions.map(action => (
                      <Button
                        key={action}
                        label={action}
                        size="small"
                        color="secondary"
                        shape={action === 'Edit Profile' ? 'default' : 'round'}>
                        {action === 'Edit Profile' ? (
                          <ButtonText>{action}</ButtonText>
                        ) : (
                          <ButtonIcon icon={GearIcon} size="lg" />
                        )}
                      </Button>
                    ))}
                  </View>
                </Layout.Header.Outer>
              </Layout.Screen>
            </View>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 233,
                right: 16,
                top: 30,
                height: 36,
                backgroundColor: '#000',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{color: 'white'}}>1:17 Wi-Fi Live activity</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function HeaderFixture() {
  return (
    <SafeAreaProvider>
      <SafeAreaInsetsContext.Provider
        value={{top: 82, left: 0, right: 0, bottom: 34}}>
        <I18nProvider i18n={i18n}>
          <ThemeProvider theme="dim">
            <MinimalModeProvider>
              <DuoRightRailContext.Provider value={true}>
                <NavigationContainer>
                  <Stack.Navigator screenOptions={{headerShown: false}}>
                    <Stack.Screen name="HeaderSamples" component={Samples} />
                  </Stack.Navigator>
                </NavigationContainer>
              </DuoRightRailContext.Provider>
            </MinimalModeProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaInsetsContext.Provider>
    </SafeAreaProvider>
  )
}
registerRootComponent(HeaderFixture)
