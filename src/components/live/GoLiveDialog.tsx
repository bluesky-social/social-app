import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent} from '#/state/session'
import {atoms as a, platform, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as TimeField from '#/components/forms/TimeField'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

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

function DialogInner({profile}: {profile: bsky.profile.AnyProfileView}) {
  const {_} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const [liveLink, setLiveLink] = useState('')
  const [liveLinkError, setLiveLinkError] = useState('')
  const [endTime, setEndTime] = useState<Date>(() => {
    const date = new Date()
    date.setHours(date.getHours() + 1)
    date.setMinutes(date.getMinutes() + 30)
    return date
  })
  const moderationOpts = useModerationOpts()

  const minTime = new Date()
  const maxTime = new Date()
  maxTime.setHours(maxTime.getHours() + 3)

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
      style={web({maxWidth: 550})}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>
            <Trans>Go Live</Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            Add a live status to your profile photo for a set time period. Your
            status will change to live as soon as you post and can be changed an
            any time.
            {/* TODO! */} <>Learn more</>
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

        <View
          style={[
            a.flex_row,
            a.align_center,
            a.flex_wrap,
            a.justify_between,
            a.w_full,
          ]}>
          <View style={[a.gap_2xs]}>
            <Text style={[a.text_sm]}>
              <Trans>How long will you be live?</Trans>
            </Text>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>Max 3 hours</Trans>
            </Text>
          </View>

          <View>
            <TimeField.TimeField
              label={_(msg`Set when your live status will end`)}
              value={endTime}
              onChangeDate={date => setEndTime(new Date(date))}
              minimumDate={minTime}
              maximumDate={maxTime}
            />
          </View>
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
