import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {
  type AppBskyActorDefs,
  AppBskyActorStatus,
  type AppBskyEmbedExternal,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'
import {differenceInMinutes} from 'date-fns'

import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {cleanError} from '#/lib/strings/errors'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {definitelyUrl} from '#/lib/strings/url-helpers'
import {useAgent} from '#/state/session'
import {useTickEveryMinute} from '#/state/shell'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, platform, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {
  useRemoveLiveStatusMutation,
  useUpsertLiveStatusMutation,
} from './queries'
import {displayDuration, useDebouncedValue} from './utils'

export function EditLiveDialog({
  control,
  status,
  embed,
}: {
  control: Dialog.DialogControlProps
  status: AppBskyActorDefs.StatusView
  embed: AppBskyEmbedExternal.View
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner status={status} embed={embed} />
    </Dialog.Outer>
  )
}

function DialogInner({
  status,
  embed,
}: {
  status: AppBskyActorDefs.StatusView
  embed: AppBskyEmbedExternal.View
}) {
  const control = Dialog.useDialogContext()
  const {_, i18n} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const [liveLink, setLiveLink] = useState(embed.external.uri)
  const [liveLinkError, setLiveLinkError] = useState('')
  const [imageLoadError, setImageLoadError] = useState(false)
  const tick = useTickEveryMinute()

  const liveLinkUrl = definitelyUrl(liveLink)
  const debouncedUrl = useDebouncedValue(liveLinkUrl, 500)

  const isDirty = liveLinkUrl !== embed.external.uri

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

  const record = useMemo(() => {
    if (!AppBskyActorStatus.isRecord(status.record)) return null
    const validation = AppBskyActorStatus.validateRecord(status.record)
    if (validation.success) {
      return validation.value
    }
    return null
  }, [status])

  const {
    mutate: goLive,
    isPending: isGoingLive,
    error: goLiveError,
  } = useUpsertLiveStatusMutation(
    record?.durationMinutes ?? 0,
    linkMeta,
    record?.createdAt,
  )

  const {
    mutate: removeLiveStatus,
    isPending: isRemovingLiveStatus,
    error: removeLiveStatusError,
  } = useRemoveLiveStatusMutation()

  const {minutesUntilExpiry, expiryDateTime} = useMemo(() => {
    tick!

    const expiry = new Date(status.expiresAt ?? new Date())
    return {
      expiryDateTime: expiry,
      minutesUntilExpiry: differenceInMinutes(expiry, new Date()),
    }
  }, [tick, status.expiresAt])

  const submitDisabled =
    isGoingLive ||
    !hasValidLinkMeta ||
    debouncedUrl !== liveLinkUrl ||
    isRemovingLiveStatus

  return (
    <Dialog.ScrollableInner
      label={_(msg`You are Live`)}
      style={web({maxWidth: 420})}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>
            <Trans>You are Live</Trans>
          </Text>
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <ClockIcon style={[t.atoms.text_contrast_high]} size="sm" />
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              {typeof record?.durationMinutes === 'number' ? (
                <Trans>
                  Expires in {displayDuration(i18n, minutesUntilExpiry)} at{' '}
                  {i18n.date(expiryDateTime, {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Trans>
              ) : (
                <Trans>No expiry set</Trans>
              )}
            </Text>
          </View>
        </View>
        <View style={[a.gap_sm]}>
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
                onSubmitEditing={() => {
                  if (isDirty && !submitDisabled) {
                    goLive()
                  }
                }}
              />
            </TextField.Root>
          </View>
          {(liveLinkError || linkMetaError) && (
            <View style={[a.flex_row, a.gap_xs, a.align_center]}>
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
              {(!linkMeta || linkMeta.image) && (
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
                  {linkMeta && imageLoadError && (
                    <CircleXIcon
                      style={[t.atoms.text_contrast_low]}
                      size="xl"
                    />
                  )}
                </View>
              )}
              <View
                style={[
                  a.flex_1,
                  a.justify_center,
                  a.py_sm,
                  a.gap_xs,
                  a.px_md,
                ]}>
                {linkMeta ? (
                  <>
                    <Text
                      numberOfLines={2}
                      style={[a.leading_snug, a.font_bold, a.text_md]}>
                      {linkMeta.title || linkMeta.url}
                    </Text>
                    <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
                      <GlobeIcon
                        size="xs"
                        style={[t.atoms.text_contrast_low]}
                      />
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
        </View>

        {goLiveError && (
          <Admonition type="error">{cleanError(goLiveError)}</Admonition>
        )}
        {removeLiveStatusError && (
          <Admonition type="error">
            {cleanError(removeLiveStatusError)}
          </Admonition>
        )}

        <View
          style={platform({
            native: [a.gap_md, a.pt_lg],
            web: [a.flex_row_reverse, a.gap_md, a.align_center],
          })}>
          {isDirty ? (
            <Button
              label={_(msg`Save`)}
              size={platform({native: 'large', web: 'small'})}
              color="primary"
              variant="solid"
              onPress={() => goLive()}
              disabled={submitDisabled}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
              {isGoingLive && <ButtonIcon icon={Loader} />}
            </Button>
          ) : (
            <Button
              label={_(msg`Close`)}
              size={platform({native: 'large', web: 'small'})}
              color="primary"
              variant="solid"
              onPress={() => control.close()}>
              <ButtonText>
                <Trans>Close</Trans>
              </ButtonText>
            </Button>
          )}
          <Button
            label={_(msg`Remove live status`)}
            onPress={() => removeLiveStatus()}
            size={platform({native: 'large', web: 'small'})}
            color="negative_secondary"
            variant="solid"
            disabled={isRemovingLiveStatus || isGoingLive}>
            <ButtonText>
              <Trans>Remove live status</Trans>
            </ButtonText>
            {isRemovingLiveStatus && <ButtonIcon icon={Loader} />}
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
