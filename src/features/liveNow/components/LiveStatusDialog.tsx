import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {
  type AppBskyActorDefs,
  type AppBskyEmbedExternal,
  moderateStatus,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {android, atoms as a, platform, tokens, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Globe_Stroke2_Corner0_Rounded} from '#/components/icons/Globe'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRightIcon} from '#/components/icons/SquareArrowTopRight'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import * as Hider from '#/components/moderation/Hider'
import {useGlobalReportDialogControl} from '#/components/moderation/ReportDialog'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {LiveIndicator} from '#/features/liveNow/components/LiveIndicator'
import type * as bsky from '#/types/bsky'

export function LiveStatusDialog({
  control,
  profile,
  embed,
  status,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  status: AppBskyActorDefs.StatusView
  embed: AppBskyEmbedExternal.View
}) {
  const navigation = useNavigation<NavigationProp>()
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle difference={!!embed.external.thumb} />
      <DialogInner
        status={status}
        profile={profile}
        embed={embed}
        navigation={navigation}
      />
    </Dialog.Outer>
  )
}

function DialogInner({
  profile,
  embed,
  navigation,
  status,
}: {
  profile: bsky.profile.AnyProfileView
  embed: AppBskyEmbedExternal.View
  navigation: NavigationProp
  status: AppBskyActorDefs.StatusView
}) {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()

  const onPressOpenProfile = useCallback(() => {
    control.close(() => {
      navigation.push('Profile', {
        name: profile.handle,
      })
    })
  }, [navigation, profile.handle, control])

  return (
    <Dialog.ScrollableInner
      label={l`${sanitizeHandle(profile.handle)} is live`}
      contentContainerStyle={[a.pt_0, a.px_0]}
      style={[web({maxWidth: 420}), a.overflow_hidden]}>
      <LiveStatus
        status={status}
        profile={profile}
        embed={embed}
        onPressOpenProfile={onPressOpenProfile}
      />
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

export function LiveStatus({
  status,
  profile,
  embed,
  padding = 'xl',
  onPressOpenProfile,
}: {
  status: AppBskyActorDefs.StatusView
  profile: bsky.profile.AnyProfileView
  embed: AppBskyEmbedExternal.View
  padding?: 'lg' | 'xl'
  onPressOpenProfile: () => void
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()
  const openLink = useOpenLink()
  const moderationOpts = useModerationOpts()
  const reportDialogControl = useGlobalReportDialogControl()
  const dialogContext = Dialog.useDialogContext()
  const moderation = useMemo(() => {
    if (!moderationOpts) return undefined
    return moderateStatus(profile, moderationOpts)
  }, [profile, moderationOpts])

  return (
    <>
      {embed.external.thumb && (
        <Hider.Outer modui={moderation?.ui('contentMedia')}>
          <Hider.Mask>
            <ModeratedImage />
          </Hider.Mask>
          <Hider.Content>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.w_full,
                a.aspect_card,
                android([
                  a.overflow_hidden,
                  {
                    borderTopLeftRadius: a.rounded_md.borderRadius,
                    borderTopRightRadius: a.rounded_md.borderRadius,
                  },
                ]),
              ]}>
              <Image
                source={embed.external.thumb}
                contentFit="cover"
                style={[a.absolute, a.inset_0]}
                accessibilityIgnoresInvertColors
              />
              <LiveIndicator
                size="large"
                style={[
                  a.absolute,
                  {top: tokens.space.lg, left: tokens.space.lg},
                  a.align_start,
                ]}
              />
            </View>
          </Hider.Content>
        </Hider.Outer>
      )}
      <View
        style={[
          a.gap_lg,
          padding === 'xl'
            ? [a.px_xl, !embed.external.thumb ? a.pt_2xl : a.pt_lg]
            : a.p_lg,
        ]}>
        <View style={[a.w_full, a.justify_center, a.gap_2xs]}>
          <Text
            numberOfLines={3}
            style={[a.leading_snug, a.font_semi_bold, a.text_xl]}>
            {embed.external.title || embed.external.uri}
          </Text>
          <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
            <Globe_Stroke2_Corner0_Rounded
              size="xs"
              style={[t.atoms.text_contrast_medium]}
            />
            <Text
              numberOfLines={1}
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              {toNiceDomain(embed.external.uri)}
            </Text>
          </View>
        </View>
        <Button
          label={l`Watch now`}
          size={platform({native: 'large', web: 'small'})}
          color="primary"
          variant="solid"
          onPress={() => {
            ax.metric('live:card:watch', {subject: profile.did})
            openLink(embed.external.uri, false)
          }}>
          <ButtonText>
            <Trans>Watch now</Trans>
          </ButtonText>
          <ButtonIcon icon={SquareArrowTopRightIcon} />
        </Button>
        <View style={[t.atoms.border_contrast_low, a.border_t, a.w_full]} />
        {moderationOpts && (
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              disabledPreview
            />
            {/* Ensure wide enough on web hover */}
            <View style={[a.flex_1, web({minWidth: 100})]}>
              <ProfileCard.NameAndHandle
                profile={profile}
                moderationOpts={moderationOpts}
              />
            </View>
            <Button
              label={l`Open profile`}
              size="small"
              color="secondary"
              variant="solid"
              onPress={() => {
                ax.metric('live:card:openProfile', {subject: profile.did})
                unstableCacheProfileView(queryClient, profile)
                onPressOpenProfile()
              }}>
              <ButtonText>
                <Trans>Open profile</Trans>
              </ButtonText>
            </Button>
          </ProfileCard.Header>
        )}
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.w_full,
            a.pt_sm,
          ]}>
          <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
            <CircleInfoIcon size="sm" fill={t.atoms.text_contrast_low.color} />
            <Text style={[t.atoms.text_contrast_low, a.text_sm]}>
              <Trans>Live feature is in beta</Trans>
            </Text>
          </View>
          {status && (
            <SimpleInlineLinkText
              label={l`Report this livestream`}
              {...createStaticClick(() => {
                function open() {
                  reportDialogControl.open({
                    subject: {
                      ...status,
                      $type: 'app.bsky.actor.defs#statusView',
                    },
                  })
                }
                if (dialogContext.isWithinDialog) {
                  dialogContext.close(open)
                } else {
                  open()
                }
              })}
              style={[a.text_sm, a.underline, t.atoms.text_contrast_medium]}>
              <Trans>Report</Trans>
            </SimpleInlineLinkText>
          )}
        </View>
      </View>
    </>
  )
}

function ModeratedImage() {
  const t = useTheme()
  const {t: l} = useLingui()
  const hider = Hider.useHider()

  return (
    <View
      style={[
        a.p_lg,
        a.py_xl,
        a.align_center,
        a.justify_center,
        t.atoms.bg_contrast_25,
      ]}>
      <View style={[a.align_center, a.gap_sm, {maxWidth: 200}]}>
        <ImageIcon size="lg" fill={t.atoms.text_contrast_medium.color} />
        <Text
          style={[
            a.italic,
            a.leading_snug,
            a.text_center,
            t.atoms.text_contrast_medium,
          ]}>
          {hider.meta.allowOverride ? (
            <Trans comment="Image has been moderated and user has the option of showing it temporarily">
              Image is hidden due to your moderation settings.
            </Trans>
          ) : (
            /*
             * In practice, if `allowOverride` is false, we won't even allow this
             * dialog to open. That is handled in
             * `#/features/liveNow/index.tsx`. But for clarity, I've included
             * this here.
             */
            <Trans comment="Image has been moderated and is not visible to the user">
              Image is unavailable.
            </Trans>
          )}
        </Text>

        {hider.meta.allowOverride && (
          <SimpleInlineLinkText
            label={l`Show anyway`}
            {...createStaticClick(() => {
              hider.setIsContentVisible(true)
            })}>
            <Trans>Show anyway</Trans>
          </SimpleInlineLinkText>
        )}
      </View>
    </View>
  )
}
