import {type StyleProp, View, type ViewStyle} from 'react-native'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {isNative, isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {getFeedTypeFromUri} from '#/state/queries/feed'
import {useProfileQuery} from '#/state/queries/profile'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

export function MissingFeed({
  style,
  hideTopBorder,
  uri,
  error,
}: {
  style?: StyleProp<ViewStyle>
  hideTopBorder?: boolean
  uri: string
  error?: unknown
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogControl()

  const type = getFeedTypeFromUri(uri)

  return (
    <>
      <Button
        label={
          type === 'feed'
            ? _(msg`Could not connect to custom feed`)
            : _(msg`Deleted list`)
        }
        accessibilityHint={_(msg`Tap for more information`)}
        onPress={control.open}
        style={[
          a.flex_1,
          a.p_lg,
          a.gap_md,
          !hideTopBorder && !a.border_t,
          t.atoms.border_contrast_low,
          a.justify_start,
          style,
        ]}>
        <View style={[a.flex_row, a.align_center]}>
          <View
            style={[
              {width: 36, height: 36},
              t.atoms.bg_contrast_25,
              a.rounded_sm,
              a.mr_md,
              a.align_center,
              a.justify_center,
            ]}>
            <WarningIcon size="lg" />
          </View>
          <View style={[a.flex_1]}>
            <Text
              emoji
              style={[a.text_sm, a.font_semi_bold, a.leading_snug, a.italic]}
              numberOfLines={1}>
              {type === 'feed' ? (
                <Trans>Feed unavailable</Trans>
              ) : (
                <Trans>Deleted list</Trans>
              )}
            </Text>
            <Text
              style={[
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.leading_snug,
                a.italic,
              ]}
              numberOfLines={1}>
              {isWeb ? (
                <Trans>Click for information</Trans>
              ) : (
                <Trans>Tap for information</Trans>
              )}
            </Text>
          </View>
        </View>
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <DialogInner uri={uri} type={type} error={error} />
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  uri,
  type,
  error,
}: {
  uri: string
  type: 'feed' | 'list'
  error: unknown
}) {
  const control = Dialog.useDialogContext()
  const t = useTheme()
  const {_} = useLingui()
  const atUri = new AtUri(uri)
  const {data: profile, isError: isProfileError} = useProfileQuery({
    did: atUri.host,
  })
  const moderationOpts = useModerationOpts()

  return (
    <Dialog.ScrollableInner
      label={
        type === 'feed'
          ? _(msg`Unavailable feed information`)
          : _(msg`Deleted list`)
      }
      style={web({maxWidth: 500})}>
      <View style={[a.gap_sm]}>
        <Text style={[a.font_bold, a.text_2xl]}>
          {type === 'feed' ? (
            <Trans>Could not connect to feed service</Trans>
          ) : (
            <Trans>Deleted list</Trans>
          )}
        </Text>
        <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
          {type === 'feed' ? (
            <Trans>
              We could not connect to the service that provides this custom
              feed. It may be temporarily unavailable and experiencing issues,
              or permanently unavailable.
            </Trans>
          ) : (
            <Trans>We could not find this list. It was probably deleted.</Trans>
          )}
        </Text>
        <Divider style={[a.my_md]} />
        <Text style={[a.font_semi_bold, t.atoms.text_contrast_high]}>
          {type === 'feed' ? (
            <Trans>Feed creator</Trans>
          ) : (
            <Trans>List creator</Trans>
          )}
        </Text>
        {profile && moderationOpts && (
          <View style={[a.w_full, a.align_start]}>
            <ProfileCard.Link profile={profile} onPress={() => control.close()}>
              <ProfileCard.Header>
                <ProfileCard.Avatar
                  profile={profile}
                  moderationOpts={moderationOpts}
                  disabledPreview
                />
                <ProfileCard.NameAndHandle
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
              </ProfileCard.Header>
            </ProfileCard.Link>
          </View>
        )}
        {isProfileError && (
          <Text
            style={[
              t.atoms.text_contrast_high,
              a.italic,
              a.text_center,
              a.w_full,
            ]}>
            <Trans>Could not find profile</Trans>
          </Text>
        )}
        {type === 'feed' && (
          <>
            <Text
              style={[a.font_semi_bold, t.atoms.text_contrast_high, a.mt_md]}>
              <Trans>Feed identifier</Trans>
            </Text>
            <Text style={[a.text_md, t.atoms.text_contrast_high, a.italic]}>
              {atUri.rkey}
            </Text>
          </>
        )}
        {error instanceof Error && (
          <>
            <Text
              style={[a.font_semi_bold, t.atoms.text_contrast_high, a.mt_md]}>
              <Trans>Error message</Trans>
            </Text>
            <Text style={[a.text_md, t.atoms.text_contrast_high, a.italic]}>
              {cleanError(error.message)}
            </Text>
          </>
        )}
      </View>
      {isNative && (
        <Button
          label={_(msg`Close`)}
          onPress={() => control.close()}
          size="small"
          variant="solid"
          color="secondary"
          style={[a.mt_5xl]}>
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      )}
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
