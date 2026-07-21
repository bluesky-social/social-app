import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {type Shadow} from '#/state/cache/types'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {getMuteState, type MuteKind} from '#/types/bsky/mute'
import {type AnyProfileView} from '#/types/bsky/profile'

type MuteDialogProps = {
  control: DialogControlProps
  profile: Shadow<AnyProfileView>
  /**
   * Called after the dialog closes. `kinds` is undefined for a full mute,
   * otherwise the complete set of kinds to scope the mute to.
   */
  onMute: (kinds?: MuteKind[]) => void
  /**
   * Called after the dialog closes. Only reachable when the account is
   * already muted in some fashion.
   */
  onUnmute: () => void
}

export function MuteDialog({
  control,
  profile,
  onMute,
  onUnmute,
}: MuteDialogProps) {
  return (
    <Dialog.Outer
      control={control}
      webOptions={{alignCenter: true}}
      nativeOptions={{preventExpansion: true}}>
      <View style={[a.relative]}>
        <Dialog.Handle />
        <MuteDialogInner
          control={control}
          profile={profile}
          onMute={onMute}
          onUnmute={onUnmute}
        />
        <Dialog.Close />
      </View>
    </Dialog.Outer>
  )
}

function MuteDialogInner({
  control,
  profile,
  onMute,
  onUnmute,
}: MuteDialogProps) {
  const t = useTheme()
  const {t: l} = useLingui()

  const {mutedReposts, mutedQuoteposts, isMutedAny} = getMuteState(
    profile.viewer,
  )

  /*
   * The inner component only mounts when the dialog opens, so initializing
   * from the current viewer state prefills the form when editing an existing
   * mute.
   */
  const [scope, setScope] = useState<'all' | 'some'>(() =>
    mutedReposts || mutedQuoteposts ? 'some' : 'all',
  )
  const [kinds, setKinds] = useState<string[]>(() => [
    ...(mutedReposts ? (['reposts'] as const) : []),
    ...(mutedQuoteposts ? (['quoteposts'] as const) : []),
  ])

  return (
    <Dialog.ScrollableInner
      label={isMutedAny ? l`Edit muted account` : l`Mute account`}
      style={[web([{maxWidth: 420}])]}>
      <View style={[a.pb_lg, a.gap_sm]}>
        <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
          {isMutedAny ? (
            <Trans>Edit muted account</Trans>
          ) : (
            <Trans>Mute account?</Trans>
          )}
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>
            You can mute all activity from this user, or only reposts and/or
            quote posts.
          </Trans>
        </Text>
      </View>
      <View style={[a.pb_lg, a.gap_lg]}>
        <SegmentedControl.Root
          label={l`Mute type`}
          type="radio"
          value={scope}
          onChange={setScope}>
          <SegmentedControl.Item value="all" label={l`Mute all`}>
            <SegmentedControl.ItemText>
              <Trans>Mute all</Trans>
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="some" label={l`Mute some`}>
            <SegmentedControl.ItemText>
              <Trans>Mute some</Trans>
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
        {scope === 'some' && (
          <Toggle.Group
            type="checkbox"
            label={l`Which activity to mute`}
            values={kinds}
            onChange={setKinds}>
            <View style={[a.gap_md]}>
              <Toggle.Item
                type="checkbox"
                name="reposts"
                label={l`Mute reposts`}>
                <Toggle.Checkbox />
                <Toggle.LabelText
                  style={[a.font_normal, a.text_md, a.leading_snug]}>
                  <Trans>Mute reposts</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
              <Toggle.Item
                type="checkbox"
                name="quoteposts"
                label={l`Mute quoteposts`}>
                <Toggle.Checkbox />
                <Toggle.LabelText
                  style={[a.font_normal, a.text_md, a.leading_snug]}>
                  <Trans>Mute quoteposts</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
            </View>
          </Toggle.Group>
        )}
      </View>
      <View style={[a.w_full, a.gap_sm, a.justify_end]}>
        <Button
          testID="muteDialogConfirmBtn"
          color="primary"
          size="large"
          disabled={scope === 'some' && kinds.length === 0}
          label={isMutedAny ? l`Save` : l`Mute`}
          onPress={() =>
            control.close(() =>
              onMute(scope === 'all' ? undefined : (kinds as MuteKind[])),
            )
          }>
          <ButtonText>
            {isMutedAny ? <Trans>Save</Trans> : <Trans>Mute</Trans>}
          </ButtonText>
        </Button>
        {isMutedAny && (
          <Button
            testID="muteDialogUnmuteBtn"
            color="secondary"
            size="large"
            label={l`Unmute`}
            onPress={() => control.close(() => onUnmute())}>
            <ButtonText>
              <Trans>Unmute</Trans>
            </ButtonText>
          </Button>
        )}
        <Button
          color="secondary"
          size="large"
          label={l`Close dialog`}
          onPress={() => control.close()}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
