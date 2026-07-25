import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type AllNavigatorParams} from '#/lib/routes/types'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {EmptyState} from '#/view/com/util/EmptyState'
import {EditBig_Stroke1_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'NotificationsActivityList'
>
export function NotificationsActivityListScreen({
  route: {
    params: {posts},
  },
}: Props) {
  const uris = decodeURIComponent(posts)
  const {_} = useLingui()

  return (
    <Layout.Screen testID="NotificationsActivityListScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <PostFeed
        feed={`posts|${uris}`}
        disablePoll
        renderEmptyState={() => (
          <EmptyState
            icon={EditIcon}
            iconSize="2xl"
            message={_(msg`No posts here`)}
          />
        )}
        renderEndOfFeed={() => <ListFooter />}
      />
    </Layout.Screen>
  )
}
