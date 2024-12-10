import React from 'react'
import {View} from 'react-native'
// import {msg} from '@lingui/macro'
// import {useLingui} from '@lingui/react'
import {useNavigation, useNavigationState} from '@react-navigation/native'

import {getCurrentRoute} from '#/lib/routes/helpers'
import {NavigationProp} from '#/lib/routes/types'
import {emitSoftReset} from '#/state/events'
import {usePinnedFeedsInfos} from '#/state/queries/feed'
import {useSelectedFeed, useSetSelectedFeed} from '#/state/shell/selected-feed'
import {atoms as a, useTheme, web} from '#/alf'
import {InlineLinkText} from '#/components/Link'

export function DesktopFeeds() {
  const t = useTheme()
  // const {_} = useLingui()
  const {data: pinnedFeedInfos} = usePinnedFeedsInfos()
  const selectedFeed = useSelectedFeed()
  const setSelectedFeed = useSetSelectedFeed()
  const navigation = useNavigation<NavigationProp>()
  const route = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  if (!pinnedFeedInfos) {
    return null
  }

  return (
    <View
      style={[
        a.flex_1,
        a.gap_md,
        web({
          paddingVertical: 2, // fixes overflow?
          overflowY: 'auto',
        }),
      ]}>
      {pinnedFeedInfos.map(feedInfo => {
        const feed = feedInfo.feedDescriptor
        const current = route.name === 'Home' && feed === selectedFeed

        return (
          <InlineLinkText
            key={feedInfo.uri}
            to={'/?' + new URLSearchParams([['feed', feed]])}
            label={feedInfo.displayName}
            onPress={() => {
              setSelectedFeed(feed)
              navigation.navigate('Home')
              if (route.name === 'Home' && feed === selectedFeed) {
                emitSoftReset()
              }
            }}
            style={[
              a.text_lg,
              current
                ? [a.font_heavy, t.atoms.text]
                : [t.atoms.text_contrast_medium],
            ]}>
            {feedInfo.displayName}
          </InlineLinkText>
        )
      })}

      {/*
      <InlineLinkText
        to="/feeds"
        label={_(msg`More feeds`)}
        style={[a.text_lg]}>
        {_(msg`More feeds`)}
      </InlineLinkText>
      */}
    </View>
  )
}
