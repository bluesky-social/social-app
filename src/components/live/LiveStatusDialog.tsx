import {View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyActorDefs, type AppBskyEmbedExternal} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {atoms as a, platform, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {Globe_Stroke2_Corner0_Rounded} from '../icons/Globe'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRightIcon} from '../icons/SquareArrowTopRight'

export function LiveStatusDialog({
  control,
  profile,
  status,
  embed,
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
        profile={profile}
        status={status}
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
}: {
  profile: bsky.profile.AnyProfileView
  status: AppBskyActorDefs.StatusView
  embed: AppBskyEmbedExternal.View
  navigation: NavigationProp
}) {
  const t = useTheme()
  const queryClient = useQueryClient()
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const openLink = useOpenLink()
  const moderationOpts = useModerationOpts()

  return (
    <Dialog.ScrollableInner
      label={_(msg`${sanitizeHandle(profile.handle)} is live`)}
      contentContainerStyle={[a.pt_0, a.px_0]}>
      {embed.external.thumb && (
        <View style={[t.atoms.bg_contrast_25, a.w_full, {aspectRatio: 1.91}]}>
          <Image
            source={embed.external.thumb}
            contentFit="cover"
            style={[a.absolute, a.inset_0]}
            accessibilityIgnoresInvertColors
          />
        </View>
      )}
      <View style={[a.gap_lg, a.pt_lg, a.px_xl]}>
        <View style={[a.flex_1, a.justify_center, a.gap_2xs]}>
          <Text
            numberOfLines={3}
            style={[a.leading_snug, a.font_bold, a.text_xl]}>
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
          label={_(msg`Watch now`)}
          size={platform({native: 'large', web: 'small'})}
          color="primary"
          variant="solid"
          onPress={() => openLink(embed.external.uri, false)}>
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
            />
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
            />
            <Button
              label={_(msg`Open profile`)}
              size="small"
              color="secondary"
              variant="solid"
              onPress={() =>
                control.close(() => {
                  unstableCacheProfileView(queryClient, profile)
                  navigation.push('Profile', {
                    name: profile.handle,
                  })
                })
              }>
              <ButtonText>
                <Trans>Open profile</Trans>
              </ButtonText>
            </Button>
          </ProfileCard.Header>
        )}
        <Text
          style={[
            a.w_full,
            a.text_center,
            t.atoms.text_contrast_low,
            a.text_sm,
          ]}>
          <Trans>Live feature is in beta testing</Trans>
        </Text>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
