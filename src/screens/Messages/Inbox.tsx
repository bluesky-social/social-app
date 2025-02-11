import {Trans} from '@lingui/macro'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesInbox'>
export function MessagesInboxScreen({}: Props) {
  return (
    <Layout.Screen testID="">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Chat request inbox</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
    </Layout.Screen>
  )
}
