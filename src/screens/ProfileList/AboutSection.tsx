import {useCallback, useImperativeHandle, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {ListMembers} from '#/view/com/lists/ListMembers'
import {EmptyState} from '#/view/com/util/EmptyState'
import {type ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {BulletList_Stroke1_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {IS_NATIVE} from '#/env'

interface SectionRef {
  scrollToTop: () => void
}

interface AboutSectionProps {
  ref?: React.Ref<SectionRef>
  list: AppBskyGraphDefs.ListView
  onPressAddUser: () => void
  headerHeight: number
  scrollElRef: ListRef
}

export function AboutSection({
  ref,
  list,
  onPressAddUser,
  headerHeight,
  scrollElRef,
}: AboutSectionProps) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {gtMobile} = useBreakpoints()
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const isOwner = list.creator.did === currentAccount?.did

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerHeight,
    })
  }, [scrollElRef, headerHeight])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const renderHeader = useCallback(() => {
    if (!isOwner) {
      return <View />
    }
    if (!gtMobile) {
      return (
        <View style={[a.px_sm, a.py_sm]}>
          <Button
            testID="addUserBtn"
            label={_(msg`Add a user to this list`)}
            onPress={onPressAddUser}
            color="primary"
            size="small"
            variant="outline"
            style={[a.py_md]}>
            <ButtonIcon icon={PersonPlusIcon} />
            <ButtonText>
              <Trans>Add people</Trans>
            </ButtonText>
          </Button>
        </View>
      )
    }
    return (
      <View style={[a.px_lg, a.py_md, a.flex_row_reverse]}>
        <Button
          testID="addUserBtn"
          label={_(msg`Add a user to this list`)}
          onPress={onPressAddUser}
          color="primary"
          size="small"
          variant="ghost"
          style={[a.py_sm]}>
          <ButtonIcon icon={PersonPlusIcon} />
          <ButtonText>
            <Trans>Add people</Trans>
          </ButtonText>
        </Button>
      </View>
    )
  }, [isOwner, _, onPressAddUser, gtMobile])

  const renderEmptyState = useCallback(() => {
    return (
      <View style={[a.gap_xl, a.align_center]}>
        <EmptyState icon={ListIcon} message={_(msg`This list is empty.`)} />
        {isOwner && (
          <Button
            testID="emptyStateAddUserBtn"
            label={_(msg`Start adding people`)}
            onPress={onPressAddUser}
            color="primary"
            size="small">
            <ButtonIcon icon={PersonPlusIcon} />
            <ButtonText>
              <Trans>Start adding people!</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    )
  }, [_, isOwner, onPressAddUser])

  return (
    <View>
      <ListMembers
        testID="listItems"
        list={list.uri}
        scrollElRef={scrollElRef}
        renderHeader={renderHeader}
        renderEmptyState={renderEmptyState}
        headerOffset={headerHeight}
        onScrolledDownChange={setIsScrolledDown}
      />
      {isScrolledDown && (
        <LoadLatestBtn
          onPress={onScrollToTop}
          label={_(msg`Scroll to top`)}
          showIndicator={false}
        />
      )}
    </View>
  )
}
