import {useRef, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useApplyPullRequestOTAUpdate} from '#/lib/hooks/useOTAUpdates'
import {atoms as a, useTheme, web} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_DEV, IS_INTERNAL, IS_NATIVE} from '#/env'

/**
 * Reports which OTA channel the running bundle came from. On a standard channel
 * this is informational and only shown to internal builds, but a channel this
 * build doesn't normally receive updates from - e.g. a pull request deployment
 * applied from the dev settings or a deep link - is called out as a warning to
 * everyone, alongside a way back to a standard build. Renders nothing on web, or
 * in a dev build, where expo-updates is disabled and none of these actions can
 * do anything.
 */
export function OTAChannelNotice({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const switchChannelControl = Dialog.useDialogControl()
  /*
   * `pending` is shared by every action the hook exposes, so track which button
   * started the work to avoid spinning all of them at once.
   */
  const [activeAction, setActiveAction] = useState<'restore' | 'check'>()
  const {
    currentChannel,
    defaultChannel,
    isCurrentlyRunningNonStandardChannel,
    isCurrentlyRunningPullRequestDeployment,
    restoreDefaultChannel,
    checkForUpdates,
    tryApplyUpdate,
    pending,
  } = useApplyPullRequestOTAUpdate()

  if (IS_DEV) return null

  if (!isCurrentlyRunningNonStandardChannel && !(IS_INTERNAL && IS_NATIVE)) {
    return null
  }

  /*
   * Internal builds get the dev tooling regardless of which channel is running.
   * Everyone else only ever sees the way back to a standard build.
   */
  const showDevTools = IS_INTERNAL && IS_NATIVE

  return (
    <>
      <Admonition.Outer
        type={isCurrentlyRunningNonStandardChannel ? 'warning' : 'info'}
        style={[t.atoms.bg_contrast_25, style]}>
        <Admonition.Row>
          <Admonition.Icon />
          <Admonition.Content>
            <View style={[a.gap_2xs]}>
              {isCurrentlyRunningNonStandardChannel ? (
                <>
                  <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                    <Trans>Non-standard OTA channel</Trans>
                  </Text>
                  <Admonition.Text>
                    <Trans>
                      This app is running a deployment of{' '}
                      <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                        {currentChannel}
                      </Text>
                      . Restore the {defaultChannel} deployment to get back to a
                      standard build.
                    </Trans>
                  </Admonition.Text>
                </>
              ) : (
                <>
                  <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                    <Trans>OTA channel</Trans>
                  </Text>
                  <Admonition.Text>
                    <Trans>
                      This app is receiving updates from{' '}
                      <Text style={[a.text_sm, a.font_bold, a.leading_snug]}>
                        {currentChannel ?? defaultChannel}
                      </Text>
                      .
                    </Trans>
                  </Admonition.Text>
                </>
              )}
            </View>
            <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
              {isCurrentlyRunningNonStandardChannel && (
                <Admonition.Button
                  color="secondary_inverted"
                  label={l`Restore the ${defaultChannel} deployment`}
                  disabled={pending}
                  onPress={() => {
                    setActiveAction('restore')
                    void restoreDefaultChannel()
                  }}>
                  <ButtonText>
                    <Trans>Restore default</Trans>
                  </ButtonText>
                  {pending && activeAction === 'restore' && (
                    <ButtonIcon icon={Loader} />
                  )}
                </Admonition.Button>
              )}
              {showDevTools && (
                <>
                  <Admonition.Button
                    color="secondary"
                    label={l`Check for OTA updates`}
                    disabled={pending}
                    onPress={() => {
                      setActiveAction('check')
                      void checkForUpdates()
                    }}>
                    <ButtonText>
                      <Trans>Check for updates</Trans>
                    </ButtonText>
                    {pending && activeAction === 'check' && (
                      <ButtonIcon icon={Loader} />
                    )}
                  </Admonition.Button>
                  <Admonition.Button
                    color="secondary"
                    label={l`Switch OTA channel`}
                    disabled={pending}
                    onPress={() => switchChannelControl.open()}>
                    <ButtonText>
                      <Trans>Switch channel</Trans>
                    </ButtonText>
                  </Admonition.Button>
                </>
              )}
            </View>
          </Admonition.Content>
        </Admonition.Row>
      </Admonition.Outer>

      {showDevTools && (
        <SwitchChannelDialog
          control={switchChannelControl}
          defaultChannel={
            isCurrentlyRunningPullRequestDeployment && currentChannel
              ? currentChannel
              : 'pull-request-'
          }
          onSubmit={channel => void tryApplyUpdate(channel)}
        />
      )}
    </>
  )
}

/**
 * Prompts for an arbitrary OTA channel to apply an update from. Internal builds
 * only - the channel is free text because it can be any deployment our update
 * server knows about.
 */
function SwitchChannelDialog({
  control,
  defaultChannel,
  onSubmit,
}: {
  control: Dialog.DialogControlProps
  defaultChannel: string
  onSubmit: (channel: string) => void
}) {
  const {t: l} = useLingui()
  const channel = useRef(defaultChannel)

  const onPressApply = () => {
    const value = channel.current.trim()
    if (!value) return
    /*
     * `onSubmit` shows native alerts of its own, which race with the sheet's
     * close animation if fired before it finishes.
     */
    control.close(() => onSubmit(value))
  }

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Switch OTA channel`}
        style={web({maxWidth: 400})}>
        <View style={[a.gap_md]}>
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>Switch OTA channel</Trans>
          </Text>
          <View style={[a.gap_sm]}>
            <TextField.LabelText nativeID="ota-channel-label">
              <Trans>Channel</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <Dialog.Input
                label={l`Channel`}
                defaultValue={defaultChannel}
                onChangeText={value => (channel.current = value)}
                accessibilityLabelledBy="ota-channel-label"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
              />
            </TextField.Root>
          </View>
          <Button
            color="primary"
            size="large"
            label={l`Apply update from this channel`}
            onPress={onPressApply}>
            <ButtonText>
              <Trans>Apply</Trans>
            </ButtonText>
          </Button>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
