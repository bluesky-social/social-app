import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useCleanError} from '#/lib/hooks/useCleanError'
import {isNative} from '#/platform/detection'
import {atoms as a, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Span, Text} from '#/components/Typography'
import {useUpdateLiveEventPreferences} from '#/features/liveEvents/preferences'
import {
  type LiveEventFeed,
  type LiveEventFeedMetricContext,
} from '#/features/liveEvents/types'

export {useDialogControl} from '#/components/Dialog'

export function LiveEventFeedOptionsMenu({
  control,
  feed,
  metricContext,
}: {
  control: Dialog.DialogControlProps
  feed: LiveEventFeed
  metricContext: LiveEventFeedMetricContext
}) {
  const {_} = useLingui()
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Configure live event banner`)}
        style={[web({maxWidth: 400})]}>
        <Inner control={control} feed={feed} metricContext={metricContext} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({
  control,
  feed,
  metricContext,
}: {
  control: Dialog.DialogControlProps
  feed: LiveEventFeed
  metricContext: LiveEventFeedMetricContext
}) {
  const {_} = useLingui()
  const {
    isPending,
    mutate: update,
    error: rawError,
    variables,
  } = useUpdateLiveEventPreferences({
    feed,
    metricContext,
    onUpdateSuccess({undoAction}) {
      Toast.show(
        <Toast.Outer>
          <Toast.Icon />
          <Toast.Text>
            <Trans>Your live event preferences have been updated.</Trans>
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

      /*
       * If there is no `undoAction`, it means that the action was already
       * undone, and therefore the menu would have been closed prior to the
       * undo happening.
       */
      if (undoAction) {
        control.close()
      }
    },
  })
  const cleanError = useCleanError()
  const error = rawError ? cleanError(rawError) : undefined

  const isHidingFeed = variables?.type === 'hideFeed' && isPending
  const isHidingAllFeeds = variables?.type === 'toggleHideAllFeeds' && isPending

  return (
    <View style={[a.gap_lg]}>
      <View style={[a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_semi_bold, a.leading_snug]}>
          <Trans>Live event options</Trans>
        </Text>

        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            Live events appear occasionally when something exciting is
            happening. If you'd like, you can hide this particular event, or all
            events for this placement in your app interface.
          </Trans>
        </Text>

        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            If you choose to hide all events, you can always re-enable them from{' '}
            <Span style={[a.font_semi_bold]}>Settings → Content & Media</Span>.
          </Trans>
        </Text>
      </View>

      <View style={[a.gap_sm]}>
        <Button
          label={_(msg`Hide this event`)}
          size="large"
          color="primary_subtle"
          onPress={() => {
            update({type: 'hideFeed', id: feed.id})
          }}>
          <ButtonText>
            <Trans>Hide this event</Trans>
          </ButtonText>
          {isHidingFeed && <ButtonIcon icon={Loader} />}
        </Button>
        <Button
          label={_(msg`Hide all events`)}
          size="large"
          color="secondary"
          onPress={() => {
            update({type: 'toggleHideAllFeeds'})
          }}>
          <ButtonText>
            <Trans>Hide all events</Trans>
          </ButtonText>
          {isHidingAllFeeds && <ButtonIcon icon={Loader} />}
        </Button>
        {isNative && (
          <Button
            label={_(msg`Cancel`)}
            size="large"
            color="secondary_inverted"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        )}
      </View>

      {error && (
        <Admonition type="error">
          {error.clean || error.raw || _(msg`An unknown error occurred.`)}
        </Admonition>
      )}
    </View>
  )
}
