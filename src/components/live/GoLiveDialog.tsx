import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyActorStatus, ComAtprotoRepoPutRecord} from '@atproto/api'
import {retry} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {imageToThumb} from '#/lib/api/resolve'
import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {cleanError} from '#/lib/strings/errors'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent, useSession} from '#/state/session'
import {useTickEveryMinute} from '#/state/shell'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, ios, native, platform, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as Select from '#/components/Select'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {displayDuration, useDebouncedValue} from './utils'

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
  const agent = useAgent()
  const {currentAccount} = useSession()
  const [liveLink, setLiveLink] = useState('')
  const [liveLinkError, setLiveLinkError] = useState('')
  const [imageLoadError, setImageLoadError] = useState(false)
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

  const liveLinkUrl = definitelyUrl(liveLink)
  const debouncedUrl = useDebouncedValue(liveLinkUrl, 500)
  const hasLink = !!debouncedUrl

  const {
    data: linkMeta,
    isSuccess: hasValidLinkMeta,
    isLoading: linkMetaLoading,
    error: linkMetaError,
  } = useQuery({
    enabled: !!debouncedUrl,
    queryKey: ['link-meta', debouncedUrl],
    queryFn: async () => {
      if (!debouncedUrl) return null
      return getLinkMeta(agent, debouncedUrl)
    },
  })

  const {
    mutate: goLive,
    isPending: isGoingLive,
    error: goLiveError,
  } = useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not logged in')

      let embed: AppBskyActorStatus.Record['embed']

      if (linkMeta) {
        let thumb

        if (linkMeta.image) {
          try {
            const img = await imageToThumb(linkMeta.image)
            if (img) {
              const blob = await uploadBlob(
                agent,
                img.source.path,
                img.source.mime,
              )
              thumb = blob.data.blob
            }
          } catch {}
        }

        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            $type: 'app.bsky.embed.external#external',
            title: linkMeta.title ?? '',
            description: linkMeta.description ?? '',
            uri: linkMeta.url,
            thumb,
          },
        }
      }

      const upsert = async () => {
        const repo = currentAccount.did
        const collection = 'app.bsky.actor.status'

        const existing = await agent.com.atproto.repo
          .getRecord({repo, collection, rkey: 'self'})
          .catch(_e => undefined)

        await agent.com.atproto.repo.putRecord({
          repo,
          collection,
          rkey: 'self',
          record: {
            $type: 'app.bsky.actor.status',
            createdAt: new Date().toISOString(),
            status: 'app.bsky.actor.status#live',
            durationMinutes: duration,
            embed,
          } satisfies AppBskyActorStatus.Record,
          swapRecord: existing?.data.cid || null,
        })
      }

      return retry(upsert, {
        maxRetries: 5,
        retryable: e => e instanceof ComAtprotoRepoPutRecord.InvalidSwapError,
      })
    },
    onError: err => {
      console.error(err)
    },
    onSuccess: () => {
      // TODO: update shadow profile
      control.close()
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
            status will change to live immediately as you post and can be
            changed at any time.
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
          <TextField.Root isInvalid={!!liveLinkError || !!linkMetaError}>
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
          {(liveLinkError || linkMetaError) && (
            <View style={[a.flex_row, a.gap_xs, a.align_center, a.mt_sm]}>
              <WarningIcon
                style={[{color: t.palette.negative_500}]}
                size="sm"
              />
              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  a.flex_1,
                  a.font_bold,
                  {color: t.palette.negative_500},
                ]}>
                {liveLinkError ? (
                  <Trans>This is not a valid link</Trans>
                ) : (
                  cleanError(linkMetaError)
                )}
              </Text>
            </View>
          )}
        </View>

        {(linkMeta || linkMetaLoading) && (
          <View
            style={[
              a.w_full,
              a.border,
              t.atoms.border_contrast_low,
              t.atoms.bg,
              a.flex_row,
              a.rounded_sm,
              a.overflow_hidden,
              a.align_stretch,
            ]}>
            <View
              style={[
                t.atoms.bg_contrast_25,
                {minHeight: 64, width: 114},
                a.justify_center,
                a.align_center,
              ]}>
              {linkMeta?.image && (
                <Image
                  source={linkMeta.image}
                  accessibilityIgnoresInvertColors
                  transition={200}
                  style={[a.absolute, a.inset_0]}
                  contentFit="cover"
                  onLoad={() => setImageLoadError(false)}
                  onError={() => setImageLoadError(true)}
                />
              )}
              {linkMeta && (!linkMeta.image || imageLoadError) && (
                <CircleXIcon style={[t.atoms.text_contrast_low]} size="xl" />
              )}
            </View>
            <View
              style={[a.flex_1, a.justify_center, a.py_xs, a.gap_xs, a.px_md]}>
              {linkMeta ? (
                <>
                  <Text
                    numberOfLines={2}
                    style={[a.leading_snug, a.font_bold, a.text_md]}>
                    {linkMeta.title || linkMeta.url}
                  </Text>
                  <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
                    <GlobeIcon size="xs" style={[t.atoms.text_contrast_low]} />
                    <Text
                      numberOfLines={1}
                      style={[
                        a.text_xs,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                      ]}>
                      {toNiceDomain(linkMeta.url)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <LoadingPlaceholder height={16} width={128} />
                  <LoadingPlaceholder height={12} width={72} />
                </>
              )}
            </View>
          </View>
        )}

        {hasLink && (
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
        )}

        {goLiveError && (
          <Admonition type="error">{cleanError(goLiveError)}</Admonition>
        )}

        <View
          style={platform({
            native: [a.gap_md],
            web: [a.flex_row_reverse, a.gap_md, a.align_center],
          })}>
          {hasLink && (
            <Button
              label={_(msg`Go Live`)}
              size={platform({native: 'large', web: 'small'})}
              color="primary"
              variant="solid"
              onPress={() => goLive()}
              disabled={isGoingLive || !hasValidLinkMeta}>
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

// passes URL.parse, and has a TLD etc
function definitelyUrl(maybeUrl: string) {
  try {
    if (maybeUrl.endsWith('.')) return null

    // Prepend 'https://' if the input doesn't start with a protocol
    if (!maybeUrl.startsWith('https://') && !maybeUrl.startsWith('http://')) {
      maybeUrl = 'https://' + maybeUrl
    }

    const url = new URL(maybeUrl)

    // Extract the hostname and split it into labels
    const hostname = url.hostname
    const labels = hostname.split('.')

    // Ensure there are at least two labels (e.g., 'example' and 'com')
    if (labels.length < 2) return null

    const tld = labels[labels.length - 1]

    // Check that the TLD is at least two characters long and contains only letters
    if (!/^[a-z]{2,}$/i.test(tld)) return null

    return url.toString()
  } catch {
    return null
  }
}
