import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent} from '#/state/session'
import {useTickEveryMinute} from '#/state/shell'
import {atoms as a, ios, native, platform, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as ProfileCard from '#/components/ProfileCard'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {displayDuration} from './utils'

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
const DURATIONS = Array.from({length: (4 * 60) / 5 + 1}).map((_, i) => i * 5)

function DialogInner({profile}: {profile: bsky.profile.AnyProfileView}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const [liveLink, setLiveLink] = useState('')
  const [liveLinkError, setLiveLinkError] = useState('')
  const [duration, setDuration] = useState(60)
  const moderationOpts = useModerationOpts()
  const tick = useTickEveryMinute()

  const time = useCallback(
    (offset: number) => {
      tick!

      const date = new Date()
      date.setMinutes(date.getMinutes() + offset)
      return i18n
        .date(date, {hour: 'numeric', minute: '2-digit', hour12: true})
        .toLocaleUpperCase()
        .replace(' ', '')
    },
    [tick, i18n],
  )

  const onChangeDuration = useCallback((newDuration: string) => {
    setDuration(Number(newDuration))
  }, [])

  const {} = useQuery({
    enabled: !!definitelyUrl(liveLink),
    queryKey: ['link-meta', liveLink],
    queryFn: async () => {
      return getLinkMeta(agent, liveLink)
    },
  })

  return (
    <Dialog.ScrollableInner
      label={_(msg`Go Live`)}
      style={web({maxWidth: 420})}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>
            <Trans>Go Live</Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            Add a live status to your profile photo for a set time period. Your
            status will change to live as soon as you post and can be changed an
            any time.
          </Text>
        </View>
        {moderationOpts && (
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              liveOverride
            />
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
            />
          </ProfileCard.Header>
        )}
        <View>
          <TextField.LabelText>
            <Trans>Live link</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={!!liveLinkError}>
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
            />
          </TextField.Root>
        </View>

        <View>
          <TextField.LabelText>
            <Trans>Go live for</Trans>
          </TextField.LabelText>
          <Select.Root
            value={String(duration)}
            onValueChange={onChangeDuration}>
            <Select.Trigger label={_(msg`Select primary language`)}>
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
        <View
          style={platform({
            native: [a.gap_md],
            web: [a.flex_row_reverse, a.gap_md, a.justify_end, a.align_center],
          })}>
          <Button
            label={_(msg`Go Live`)}
            size={platform({native: 'large', web: 'small'})}
            color="primary"
            variant="solid">
            <ButtonText>
              <Trans>Go Live</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Go Live`)}
            size={platform({native: 'large', web: 'small'})}
            color="secondary"
            variant={platform({native: 'solid', web: 'ghost'})}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

function definitelyUrl(maybeUrl: string) {
  try {
    return new URL(maybeUrl).toString()
  } catch {
    return null
  }
}
