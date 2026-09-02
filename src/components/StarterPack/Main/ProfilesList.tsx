import {forwardRef, useCallback, useImperativeHandle, useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {cleanError} from '#/lib/strings/errors'
import {useAllListMembersQuery} from '#/state/queries/list-members'
import {useListMembershipRemoveMutation} from '#/state/queries/list-memberships'
import {useSession} from '#/state/session'
import {List, type ListRef} from '#/view/com/util/List'
import {type SectionRef} from '#/screens/Profile/Sections/types'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Default as ProfileCard} from '#/components/ProfileCard'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {type app} from '#/lexicons'

function keyExtractor(item: app.bsky.graph.defs.ListItemView) {
  return item.uri
}

interface ProfilesListProps {
  listUri: string
  moderationOpts: ModerationOpts
  headerHeight: number
  scrollElRef: ListRef
}

export const ProfilesList = forwardRef<SectionRef, ProfilesListProps>(
  function ProfilesListImpl(
    {listUri, moderationOpts, headerHeight, scrollElRef},
    ref,
  ) {
    const t = useTheme()
    const bottomBarOffset = useBottomBarOffset(headerHeight)
    const initialNumToRender = useInitialNumToRender()
    const {currentAccount} = useSession()
    const {data, refetch, isError} = useAllListMembersQuery(listUri)

    const [isPTRing, setIsPTRing] = useState(false)

    // The server returns these sorted by descending creation date, so we want to invert

    const listItems = data
      ?.filter(
        p => !isBlockedOrBlocking(p.subject) && !p.subject.associated?.labeler,
      )
      .reverse()
    const isOwn = new AtUri(listUri).host === currentAccount?.did

    const getSortedProfiles = () => {
      if (!listItems) return

      return [...listItems].sort((a, b) => {
        if (a.subjectOptedOut !== b.subjectOptedOut) {
          return a.subjectOptedOut ? -1 : 1
        }
        if (isOwn) {
          if (a.subject.did === currentAccount?.did) return -1
          if (b.subject.did === currentAccount?.did) return 1
        }
        return 0
      })
    }
    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: IS_NATIVE,
        offset: -headerHeight,
      })
    }, [scrollElRef, headerHeight])

    useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderItem = ({
      item,
      index,
    }: ListRenderItemInfo<app.bsky.graph.defs.ListItemView>) => {
      return (
        <View
          style={[
            a.p_lg,
            t.atoms.border_contrast_low,
            (IS_WEB || index !== 0) && a.border_t,
          ]}>
          <ProfileCard
            profile={item.subject}
            moderationOpts={moderationOpts}
            logContext="StarterPackProfilesList"
          />
          {item.subjectOptedOut ? (
            <OptedOutControls item={item} listUri={listUri} canRemove={isOwn} />
          ) : null}
        </View>
      )
    }

    if (!data) {
      return (
        <View
          style={[
            a.h_full_vh,
            {marginTop: headerHeight, marginBottom: bottomBarOffset},
          ]}>
          <ListMaybePlaceholder
            isLoading={true}
            isError={isError}
            onRetry={refetch}
          />
        </View>
      )
    }

    if (data)
      return (
        <List
          data={getSortedProfiles()}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ref={scrollElRef}
          headerOffset={headerHeight}
          ListFooterComponent={
            <ListFooter
              style={{paddingBottom: bottomBarOffset, borderTopWidth: 0}}
            />
          }
          showsVerticalScrollIndicator={false}
          desktopFixedHeight
          initialNumToRender={initialNumToRender}
          refreshing={isPTRing}
          onRefresh={async () => {
            setIsPTRing(true)
            await refetch()
            setIsPTRing(false)
          }}
        />
      )
  },
)

function OptedOutControls({
  item,
  listUri,
  canRemove,
}: {
  item: app.bsky.graph.defs.ListItemView
  listUri: string
  canRemove: boolean
}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const [isRemoved, setIsRemoved] = useState(false)
  const {mutate: removeMembership, isPending} = useListMembershipRemoveMutation(
    {
      onSuccess: () => {
        setIsRemoved(true)
        Toast.show(_(msg`Removed from starter pack`))
      },
      onError: error =>
        Toast.show(cleanError(error), {
          type: 'error',
        }),
    },
  )

  if (isRemoved) return null

  return (
    <Admonition.Outer type="info" style={[a.mt_sm]}>
      <Admonition.Row style={[a.align_center]}>
        <Admonition.Icon />
        <Admonition.Content>
          <Admonition.Text>
            <Trans>Opted out of this starter pack</Trans>
          </Admonition.Text>
        </Admonition.Content>
        {canRemove ? (
          <Admonition.Button
            label={_(msg`Remove user from starter pack`)}
            color="secondary"
            disabled={isPending}
            onPress={() => {
              ax.metric('starterPack:removeUser', {context: 'opt-out'})
              removeMembership({
                listUri,
                actorDid: item.subject.did,
                membershipUri: item.uri,
              })
            }}>
            {isPending ? (
              <ButtonIcon icon={Loader} />
            ) : (
              <ButtonText>
                <Trans>Remove</Trans>
              </ButtonText>
            )}
          </Admonition.Button>
        ) : null}
      </Admonition.Row>
    </Admonition.Outer>
  )
}
