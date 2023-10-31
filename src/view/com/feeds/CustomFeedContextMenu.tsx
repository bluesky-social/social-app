import React from 'react'
import {useNavigation} from '@react-navigation/native'
import {AtUri} from '@atproto/api'

import {Haptics} from 'lib/haptics'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {useStores} from 'state/index'
import {NavigationProp} from 'lib/routes/types'
import {toShareUrl} from 'lib/strings/url-helpers'
import {shareUrl} from 'lib/sharing'
import {useAnalytics} from 'lib/analytics/analytics'
import * as Toast from 'view/com/util/Toast'

export function CustomFeedContextMenu({
  children,
  feed,
  ...rest
}: React.PropsWithChildren<
  {feed: CustomFeedModel} & Omit<
    React.ComponentProps<typeof NativeDropdown>,
    'items'
  >
>) {
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const handleOrDid = feed?.data?.creator?.handle || feed?.data?.creator?.did
  const {track} = useAnalytics()

  const onPressAbout = React.useCallback(() => {
    store.shell.openModal({
      name: 'confirm',
      title: feed?.displayName || '',
      message: feed?.data.description || 'This feed has no description.',
      confirmBtnText: 'Close',
      onPressConfirm() {},
    })
  }, [store, feed])

  const onPressViewAuthor = React.useCallback(() => {
    navigation.navigate('Profile', {name: handleOrDid})
  }, [handleOrDid, navigation])

  const onPressShare = React.useCallback(() => {
    const {rkey} = new AtUri(feed.uri)
    const url = toShareUrl(`/profile/${handleOrDid}/feed/${rkey}`)
    shareUrl(url)
    track('CustomFeed:Share')
  }, [feed.uri, handleOrDid, track])

  const onPressReport = React.useCallback(() => {
    if (!feed) return
    store.shell.openModal({
      name: 'report',
      uri: feed.uri,
      cid: feed.data.cid,
    })
  }, [store, feed])

  const onToggleSaved = React.useCallback(async () => {
    try {
      Haptics.default()
      if (feed?.isSaved) {
        await feed?.unsave()
      } else {
        await feed?.save()
      }
    } catch (err) {
      Toast.show(
        'There was an an issue updating your feeds, please check your internet connection and try again.',
      )
      store.log.error('Failed up update feeds', {err})
    }
  }, [store, feed])

  const dropdownItems: DropdownItem[] = React.useMemo(() => {
    return [
      feed
        ? {
            testID: 'feedHeaderDropdownAboutBtn',
            label: 'About this feed',
            onPress: onPressAbout,
            icon: {
              ios: {
                name: 'info.circle',
              },
              android: '',
              web: 'info',
            },
          }
        : undefined,
      {
        testID: 'feedHeaderDropdownViewAuthorBtn',
        label: 'View author',
        onPress: onPressViewAuthor,
        icon: {
          ios: {
            name: 'person',
          },
          android: '',
          web: ['far', 'user'],
        },
      },
      {
        testID: 'feedHeaderDropdownToggleSavedBtn',
        label: feed?.isSaved ? 'Remove from my feeds' : 'Add to my feeds',
        onPress: onToggleSaved,
        icon: feed?.isSaved
          ? {
              ios: {
                name: 'trash',
              },
              android: 'ic_delete',
              web: 'trash',
            }
          : {
              ios: {
                name: 'plus',
              },
              android: '',
              web: 'plus',
            },
      },
      {
        testID: 'feedHeaderDropdownReportBtn',
        label: 'Report feed',
        onPress: onPressReport,
        icon: {
          ios: {
            name: 'exclamationmark.triangle',
          },
          android: 'ic_menu_report_image',
          web: 'circle-exclamation',
        },
      },
      {
        testID: 'feedHeaderDropdownShareBtn',
        label: 'Share link',
        onPress: onPressShare,
        icon: {
          ios: {
            name: 'square.and.arrow.up',
          },
          android: 'ic_menu_share',
          web: 'share',
        },
      },
    ].filter(Boolean) as DropdownItem[]
  }, [
    feed,
    onPressAbout,
    onToggleSaved,
    onPressReport,
    onPressShare,
    onPressViewAuthor,
  ])

  return (
    <NativeDropdown
      testID="feedHeaderDropdownBtn"
      items={dropdownItems}
      accessibilityLabel="More options"
      accessibilityHint=""
      {...rest}>
      {children}
    </NativeDropdown>
  )
}
