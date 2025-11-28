import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {type Action, type State} from '../state'

export function ViewMatches({}: {
  state: Extract<State, {step: '4: view matches'}>
  dispatch: React.Dispatch<Action>
}) {
  return (
    <View style={[a.h_full]}>
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content />
        <Layout.Header.Slot />
      </Layout.Header.Outer>
    </View>
  )
}
