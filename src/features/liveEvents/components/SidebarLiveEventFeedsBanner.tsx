import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as CloseIcon} from '#/components/icons/Times'
import * as Toast from '#/components/Toast'
import {LiveEventFeedCardCompact} from '#/features/liveEvents/components/LiveEventFeedCardCompact'
import {useUserPreferencedLiveEvents} from '#/features/liveEvents/context'
import {useUpdateLiveEventPreferences} from '#/features/liveEvents/preferences'
import {type LiveEventFeed} from '#/features/liveEvents/types'

export function SidebarLiveEventFeedsBanner() {
  const events = useUserPreferencedLiveEvents()
  return events.feeds.map(feed => <Inner key={feed.id} feed={feed} />)
}

function Inner({feed}: {feed: LiveEventFeed}) {
  const {_} = useLingui()
  const layout = feed.layouts.wide

  const {mutate: update, variables} = useUpdateLiveEventPreferences({
    feed,
    metricContext: 'sidebar',
    onUpdateSuccess({undoAction}) {
      Toast.show(
        <Toast.Outer>
          <Toast.Icon />
          <Toast.Text>
            {undoAction ? (
              <Trans>Live event hidden</Trans>
            ) : (
              <Trans>Live event unhidden</Trans>
            )}
          </Toast.Text>
          {undoAction && (
            <Toast.Action
              label={_(msg`Undo`)}
              onPress={() => {
                if (undoAction) {
                  update(undoAction)
                }
              }}>
              <Trans>Undo</Trans>
            </Toast.Action>
          )}
        </Toast.Outer>,
        {type: 'success'},
      )
    },
  })

  if (variables) return null

  return (
    <View style={[a.relative]}>
      <LiveEventFeedCardCompact feed={feed} metricContext="sidebar" />

      <View
        style={[a.justify_center, a.absolute, {top: 0, right: 6, bottom: 0}]}>
        <Button
          label={_(msg`Dismiss live event banner`)}
          size="tiny"
          shape="round"
          style={[a.z_10]}
          onPress={() => {
            update({type: 'hideFeed', id: feed.id})
          }}>
          {({hovered, pressed}) => (
            <>
              <View
                style={[
                  a.absolute,
                  a.inset_0,
                  a.rounded_full,
                  {
                    backgroundColor: layout.overlayColor,
                    opacity: hovered || pressed ? 0.8 : 0.6,
                  },
                ]}
              />
              <CloseIcon size="xs" fill={layout.textColor} style={[a.z_20]} />
            </>
          )}
        </Button>
      </View>
    </View>
  )
}
