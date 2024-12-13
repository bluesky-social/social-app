import {Trans} from '@lingui/macro'

import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function Screen() {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Create Vouch</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <Text>Create</Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
