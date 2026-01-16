import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {definitelyUrl} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useLiveNowConfig} from '#/state/service-config'
import {useTickEveryMinute} from '#/state/shell'
import {atoms as a, ios, native, platform, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {
  displayDuration,
  getLiveServiceNames,
  useDebouncedValue,
} from '#/components/live/utils'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {LinkPreview} from './LinkPreview'
import {useLiveLinkMetaQuery, useUpsertLiveStatusMutation} from './queries'

export function GoLiveDialog({
  control,
  profile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner profile={profile} />
    </Dialog.Outer>
  )
}

// Possible durations: max 4 hours, 5 minute intervals
const DURATIONS = Array.from({length: (4 * 60) / 5}).map((_, i) => (i + 1) * 5)

function DialogInner({profile}: {profile: bsky.profile.AnyProfileView}) {
  const control = Dialog.useDialogContext()
  const {_, i18n} = useLingui()
  const t = useTheme()
  const [liveLink, setLiveLink] = useState('')
  const [liveLinkError, setLiveLinkError] = useState('')
  const [duration, setDuration] = useState(60)
  const moderationOpts = useModerationOpts()
  const tick = useTickEveryMinute()
  const liveNowConfig = useLiveNowConfig()
  const {formatted: allowedServices} = getLiveServiceNames(
    liveNowConfig.allowedDomains,
  )

  const time = useCallback(
    (offset: number) => {
      void tick

      const date = new Date()
      date.setMinutes(date.getMinutes() + offset)
      return i18n.date(date, {hour: 'numeric', minute: '2-digit', hour12: true})
    },
    [tick, i18n],
  )

  const onChangeDuration = useCallback((newDuration: string) => {
    setDuration(Number(newDuration))
  }, [])

  const liveLinkUrl = definitelyUrl(liveLink)
  const debouncedUrl = useDebouncedValue(liveLinkUrl, 500)

  const {
    data: linkMeta,
    isSuccess: hasValidLinkMeta,
    isLoading: linkMetaLoading,
    error: linkMetaError,
  } = useLiveLinkMetaQuery(debouncedUrl)

  const {
    mutate: goLive,
    isPending: isGoingLive,
    error: goLiveError,
  } = useUpsertLiveStatusMutation(duration, linkMeta)

  const isSourceInvalid = !!liveLinkError || !!linkMetaError

  const hasLink = !!debouncedUrl && !isSourceInvalid

  return (
    <Dialog.ScrollableInner
      label={_(msg`Go Live`)}
      style={web({maxWidth: 420})}>
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_semi_bold, a.text_2xl]}>
            <Trans>Go Live</Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>
              Add a temporary live status to your profile. When someone clicks
              on your avatar, they’ll see information about your live event.
            </Trans>
          </Text>
        </View>
        {moderationOpts && (
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              liveOverride
              disabledPreview
            />
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
            />
          </ProfileCard.Header>
        )}
        <View style={[a.gap_sm]}>
          <View>
            <TextField.LabelText>
              <Trans>Live link</Trans>
            </TextField.LabelText>
            <TextField.Root isInvalid={isSourceInvalid}>
              <TextField.Input
                label={_(msg`Live link`)}
                placeholder={_(msg`www.mylivestream.tv`)}
                value={liveLink}
                onChangeText={setLiveLink}
                onFocus={() => setLiveLinkError('')}
                onBlur={() => {
                  if (!definitelyUrl(liveLink)) {
                    setLiveLinkError('Invalid URL')
                  }
                }}
                returnKeyType="done"
                autoCapitalize="none"
                autoComplete="url"
                autoCorrect={false}
              />
            </TextField.Root>
          </View>
          {liveLinkError || linkMetaError ? (
            <Admonition type="error">
              {liveLinkError ? (
                <Trans>This is not a valid link</Trans>
              ) : (
                cleanError(linkMetaError)
              )}
            </Admonition>
          ) : (
            <Admonition type="tip">
              <Trans>
                The following services are enabled for your account:{' '}
                {allowedServices}
              </Trans>
            </Admonition>
          )}

          <LinkPreview linkMeta={linkMeta} loading={linkMetaLoading} />
        </View>

        {hasLink && (
          <View>
            <TextField.LabelText>
              <Trans>Go live for</Trans>
            </TextField.LabelText>
            <Select.Root
              value={String(duration)}
              onValueChange={onChangeDuration}>
              <Select.Trigger label={_(msg`Select duration`)}>
                <Text style={[ios(a.py_xs)]}>
                  {displayDuration(i18n, duration)}
                  {'  '}
                  <Text style={[t.atoms.text_contrast_low]}>
                    {time(duration)}
                  </Text>
                </Text>

                <Select.Icon />
              </Select.Trigger>
              <Select.Content
                renderItem={(item, _i, selectedValue) => {
                  const label = displayDuration(i18n, item)
                  return (
                    <Select.Item value={String(item)} label={label}>
                      <Select.ItemIndicator />
                      <Select.ItemText>
                        {label}
                        {'  '}
                        <Text
                          style={[
                            native(a.text_md),
                            web(a.ml_xs),
                            selectedValue === String(item)
                              ? t.atoms.text_contrast_medium
                              : t.atoms.text_contrast_low,
                            a.font_normal,
                          ]}>
                          {time(item)}
                        </Text>
                      </Select.ItemText>
                    </Select.Item>
                  )
                }}
                items={DURATIONS}
                valueExtractor={d => String(d)}
              />
            </Select.Root>
          </View>
        )}

        {goLiveError && (
          <Admonition type="error">{cleanError(goLiveError)}</Admonition>
        )}

        <View
          style={platform({
            native: [a.gap_md, a.pt_lg],
            web: [a.flex_row_reverse, a.gap_md, a.align_center],
          })}>
          {hasLink && (
            <Button
              label={_(msg`Go Live`)}
              size={platform({native: 'large', web: 'small'})}
              color="primary"
              variant="solid"
              onPress={() => goLive()}
              disabled={
                isGoingLive || !hasValidLinkMeta || debouncedUrl !== liveLinkUrl
              }>
              <ButtonText>
                <Trans>Go Live</Trans>
              </ButtonText>
              {isGoingLive && <ButtonIcon icon={Loader} />}
            </Button>
          )}
          <Button
            label={_(msg`Cancel`)}
            onPress={() => control.close()}
            size={platform({native: 'large', web: 'small'})}
            color="secondary"
            variant={platform({native: 'solid', web: 'ghost'})}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
