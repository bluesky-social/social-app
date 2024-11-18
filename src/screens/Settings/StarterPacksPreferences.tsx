import React from 'react'
import {ListRenderItemInfo, Text, View} from 'react-native'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useActorStarterPacksQuery} from '#/state/queries/actor-starter-packs'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, ios, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {SearchInput} from '#/components/forms/SearchInput'
import {EditBig_Stroke2_Corner0_Rounded as Edit} from '#/components/icons/EditBig'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Layout from '#/components/Layout'
import {Default as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {navigate} from '#/Navigation'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesStarterPacks'
>
export function StarterPacksPreferencesScreen({}: Props) {
  const {_} = useLingui()

  return (
    <Layout.Screen testID="starterPacksPreferencesScreen">
      <Layout.Header title={_(msg`Starter Packs`)} />
      <Layout.Content>
        <StarterPackList />
      </Layout.Content>
    </Layout.Screen>
  )
}

function Empty() {
  const t = useTheme()

  return (
    <View style={[a.p_xl, a.align_center]}>
      <Text style={[a.text_lg, t.atoms.text_contrast_medium]}>
        <Trans>You haven't created a starter pack yet!</Trans>
      </Text>
    </View>
  )
}

function keyExtractor(item: AppBskyGraphDefs.StarterPackView) {
  return item.uri
}

function StarterPackList() {
  const {_} = useLingui()
  const t = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {isTabletOrDesktop} = useWebMediaQueries()
  const {currentAccount} = useSession()
  const {data, refetch, isFetching, hasNextPage, fetchNextPage} =
    useActorStarterPacksQuery({
      did: currentAccount?.did,
    })
  const [query, setQuery] = React.useState('')

  const onChangeQuery = (text: string) => {
    setQuery(text)
  }

  const onPressCancelSearch = () => {
    setQuery('')
  }

  const openCreateScreen = () => {
    navigate('StarterPackWizard')
  }

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh starter packs', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more starter packs', {message: err})
    }
  }, [isFetching, hasNextPage, fetchNextPage])

  const items = data?.pages
    .flatMap(page => page.starterPacks)
    .filter(item => {
      return (item.record as any).name
        .toLowerCase()
        .includes(query.toLowerCase())
    })
    .sort((itemA, itemB) => {
      return (itemA as any).record.name < (itemB as any).record.name ? -1 : 1
    })

  const hasItems = items?.length !== undefined && items.length > 0

  const renderItem = ({
    item,
    index,
  }: ListRenderItemInfo<AppBskyGraphDefs.StarterPackView>) => {
    const openStartPackEditScreen = () => {
      const id = item.uri.split('/').pop()
      navigate('StarterPackEdit', {rkey: id})
    }

    return (
      <View
        style={[
          a.flex_row,
          a.gap_md,
          a.align_center,
          a.p_lg,
          a.overflow_hidden,
          (isTabletOrDesktop || index !== 0) && a.border_t,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_grow, a.flex_shrink]}>
          <StarterPackCard starterPack={item} noAuthorInfo noDescription />
        </View>
        <Button
          testID="editStarterPackButton"
          label={_(msg`Edit`)}
          variant="ghost"
          color="primary"
          size="small"
          style={[a.flex_shrink_0]}
          onPress={openStartPackEditScreen}>
          <ButtonText>
            <Trans>Edit</Trans>
          </ButtonText>
          <ButtonIcon icon={Edit} />
        </Button>
      </View>
    )
  }

  const listFooter = () => {
    return (
      <View
        style={[
          a.justify_center,
          a.align_center,
          a.pt_lg,
          a.border_t,
          hasItems && t.atoms.border_contrast_low,
        ]}>
        <Button
          label={
            hasItems ? _(msg`Create another`) : _(msg`Create a Starter Pack`)
          }
          variant="solid"
          color="secondary"
          size="small"
          onPress={openCreateScreen}>
          <ButtonText>
            <Trans>
              {hasItems ? 'Create another' : 'Create a Starter Pack'}
            </Trans>
          </ButtonText>
          <ButtonIcon icon={Plus} position="right" />
        </Button>
      </View>
    )
  }

  return (
    <View>
      <View style={[a.flex_row, a.gap_md, a.p_lg]}>
        <View style={[a.flex_grow, a.flex_shrink]}>
          <SearchInput
            value={query}
            onChangeText={onChangeQuery}
            onClearText={onPressCancelSearch}
            placeholder={_(msg`Search your starter packs`)}
          />
        </View>
        <Button
          label={_(msg`Create`)}
          variant="solid"
          color="secondary"
          size="small"
          style={[a.flex_shrink_0]}
          onPress={openCreateScreen}>
          <ButtonText>
            <Trans>Create</Trans>
          </ButtonText>
          <ButtonIcon icon={Plus} position="right" />
        </Button>
      </View>
      <List
        testID="starterPacksList"
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        progressViewOffset={ios(0)}
        indicatorStyle={t.name === 'light' ? 'black' : 'white'}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={onEndReached}
        onRefresh={onRefresh}
        ListEmptyComponent={Empty}
        ListFooterComponent={listFooter}
      />
    </View>
  )
}
