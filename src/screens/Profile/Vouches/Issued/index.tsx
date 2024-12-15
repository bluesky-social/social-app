import React from 'react'
import {ListRenderItemInfo,View} from 'react-native'
import {AppBskyActorDefs,AppBskyGraphDefs} from '@atproto/api'
import {msg,Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useVouchesIssued} from '#/state/queries/vouches/useVouchesIssued'
import {List} from '#/view/com/util/List'
import {VouchList} from '#/screens/Profile/Vouches/components/Vouch'
import {atoms as a, useGutters,useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function Screen() {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Issued Vouches</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Inner />
    </Layout.Screen>
  )
}

type ListItem =
  | {
      key: string
      type: 'error'
    }
  | {
      key: string
      type: 'placeholder'
    }
  | {
      key: string
      type: 'empty'
    }
  | {
      key: string
      type: 'vouch'
      vouch: AppBskyGraphDefs.VouchView
      subject: AppBskyActorDefs.ProfileViewBasic
    }

export function Inner() {
  const [isPTR, setIsPTR] = React.useState(false)
  const {
    data,
    isFetching,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useVouchesIssued()

  const onEndReached = React.useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return
    fetchNextPage()
  }, [fetchNextPage, isFetchingNextPage, hasNextPage])

  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [setIsPTR, refetch])

  const items = React.useMemo<ListItem[]>(() => {
    const _items: ListItem[] = []

    const vouches = data?.pages.flatMap(page => page.vouches) || []

    if (vouches.length) {
      for (const vouch of vouches) {
        _items.push({
          key: vouch.cid,
          type: 'vouch',
          vouch,
          subject: vouch.subject!,
        })
      }
    } else {
      _items.push({key: 'empty', type: 'empty'})
    }

    if (isFetching) {
      _items.push({key: 'loading', type: 'placeholder'})
    } else if (error) {
      _items.push({key: 'error', type: 'error'})
    }

    return _items
  }, [data, error, isFetching])

  const renderItem = React.useCallback(
    ({item, index}: ListRenderItemInfo<ListItem>) => {
      switch (item.type) {
        case 'vouch': {
          return (
            <VouchList
              vouch={item.vouch}
              subject={item.subject}
              first={index === 0}
            />
          )
        }
        case 'empty': {
          return <Empty />
        }
        case 'placeholder': {
          // TODO
          return <View style={[a.gap_md]} />
        }
        case 'error': {
          // TODO
          return (
            <Admonition type="error">
              <Trans>Error</Trans>
            </Admonition>
          )
        }
      }
    },
    [],
  )

  return (
    <List
      data={items}
      keyExtractor={item => item.key}
      renderItem={renderItem}
      refreshing={isPTR}
      onRefresh={onPullToRefresh}
      initialNumToRender={10}
      onEndReached={onEndReached}
      desktopFixedHeight
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  )
}

export function Empty() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters(['base', 'wide'])

  return (
    <View style={[gutters]}>
      <Text
        style={[
          a.text_md,
          a.leading_snug,
          a.text_center,
          t.atoms.text_contrast_medium,
        ]}>
        <Trans>
          You haven't vouched for anyone.{' '}
          <InlineLinkText
            label={_(msg`Create a vouch`)}
            to={{screen: 'ProfileVouchesCreate'}}
            style={[a.text_md, a.leading_snug]}>
            <Trans>Create one here.</Trans>
          </InlineLinkText>
        </Trans>
      </Text>
    </View>
  )
}
