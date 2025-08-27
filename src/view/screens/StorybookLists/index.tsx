import React from 'react'
import {View} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useSetThemePrefs} from '#/state/shell'
import {ListContained} from '#/view/screens/Storybook/ListContained'
import {atoms as a, ThemeProvider} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'

export function StorybookLists() {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Storybook</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content keyboardShouldPersistTaps="handled">
        <StorybookInner />
      </Layout.Content>
    </Layout.Screen>
  )
}

function StorybookInner() {
  return null
}
