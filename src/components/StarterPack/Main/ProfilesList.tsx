import {forwardRef, useCallback, useImperativeHandle, useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {Trans} from '@lingui/react/macro'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {useAllListMembersQuery} from '#/state/queries/list-members'
import {useSession} from '#/state/session'
import {List, type ListRef} from '#/view/com/util/List'
import {type SectionRef} from '#/screens/Profile/Sections/types'
import {atoms as a, useTheme} from '#/alf'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {Default as ProfileCard} from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
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
      if (!isOwn) return listItems

      const myIndex = listItems.findIndex(
        item => item.subject.did === currentAccount?.did,
      )
      return myIndex !== -1
        ? [
            listItems[myIndex],
            ...listItems.slice(0, myIndex),
            ...listItems.slice(myIndex + 1),
          ]
        : listItems
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
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>Opted out of this starter pack</Trans>
            </Text>
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
