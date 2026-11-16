import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {formatTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {formatCount} from '#/view/com/util/numeric/format'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {getGalleryImages} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Gallery from '#/components/Gallery'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {GrainFull, GrainMark} from '#/components/icons/community/Grain'
import {Heart2_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner2_Rounded as ImageIcon} from '#/components/icons/Image'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Square'
import * as ProfileCard from '#/components/ProfileCard'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {PhotoDialogGallery} from './PhotoDialogGallery'

export function PhotoDialog({
  control,
  photo,
  author,
}: {
  control: Dialog.DialogControlProps
  photo: app.bsky.embed.external.ViewGallery
  author: app.bsky.actor.defs.ProfileViewBasic
}) {
  const {t: l} = useLingui()
  const title = photo.title

  return (
    <Dialog.Outer control={control} testID="atmospherePhotoDialog">
      <Dialog.Handle />
      <Gallery.Bleed>
        <Dialog.ScrollableInner
          label={l({
            message: `Photos: ${title}`,
            comment:
              'Accessibility label for a dialog (a popup window) showing a photo gallery. {title} is the gallery title, written by its author.',
          })}
          style={[web({maxWidth: 600})]}>
          <PhotoDialogInner control={control} photo={photo} author={author} />
          <Dialog.Close />
        </Dialog.ScrollableInner>
      </Gallery.Bleed>
    </Dialog.Outer>
  )
}

function PhotoDialogInner({
  control,
  photo,
  author,
}: {
  control: Dialog.DialogControlProps
  photo: app.bsky.embed.external.ViewGallery
  author: app.bsky.actor.defs.ProfileViewBasic
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const openLink = useOpenLink({preferNativeApp: true})
  const moderationOpts = useModerationOpts()

  const createdAt = photo.createdAt
  const hasDate = !!createdAt && !Number.isNaN(Date.parse(createdAt))
  const likeCount = photo.likeCount ?? 0
  const photoCount = photo.photoCount ?? getGalleryImages(photo).length
  const likes = formatCount(i18n, likeCount)
  const photos = formatCount(i18n, photoCount)
  if (!author || !moderationOpts) return null

  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <Text
          testID="atmospherePhotoDialogSource"
          style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans comment='Shown right before the Grain logo, as in "Powered by Grain". Grain is a photo-sharing app built on the AT Protocol.'>
            Powered by
          </Trans>
        </Text>
        <GrainFull width={45} fill={t.atoms.text.color} />
      </View>
      <ProfileCard.Link
        profile={author}
        onPress={() => control.close()}
        style={[a.flex_row, a.align_center, a.gap_md, a.py_sm, a.pb_xs]}>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            size={40}
            profile={author}
            moderationOpts={moderationOpts}
          />

          <ProfileCard.NameAndHandle
            profile={author}
            moderationOpts={moderationOpts}
          />
        </ProfileCard.Header>
      </ProfileCard.Link>
      <PhotoDialogGallery photo={photo} />
      <View style={[a.gap_xs, a.pb_md]}>
        <Text emoji style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
          {photo.title}
        </Text>
        {photo.description.trim() ? (
          <RichText
            value={photo.description}
            disableMentionFacetValidation
            onLinkPress={() => control.close()}
            style={[a.text_md, a.leading_snug]}
          />
        ) : null}
        <View
          style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_md, a.pt_sm]}>
          {likeCount > 0 ? (
            <Stat
              testID="atmospherePhotoDialogLikes"
              icon={HeartIcon}
              label={l({
                message: plural(likeCount, {
                  one: `${likes} like`,
                  other: `${likes} likes`,
                }),
                comment:
                  'Number of likes on a photo gallery. {likes} is already abbreviated and formatted, e.g. "1.2K".',
              })}
            />
          ) : null}
          <Stat
            testID="atmospherePhotoDialogPhotos"
            icon={ImageIcon}
            label={l({
              message: plural(photoCount, {
                one: `${photos} photo`,
                other: `${photos} photos`,
              }),
              comment:
                'Number of photos in a gallery. {photos} is already formatted.',
            })}
          />
          {hasDate ? (
            <TimeElapsed timestamp={createdAt} timeToString={formatTimeAgo}>
              {({timeElapsed}) => (
                <Stat
                  testID="atmospherePhotoDialogTime"
                  icon={ClockIcon}
                  label={timeElapsed}
                />
              )}
            </TimeElapsed>
          ) : null}
        </View>
      </View>
      <Button
        testID="atmospherePhotoDialogViewOnGrain"
        label={l({
          message: 'View on Grain',
          comment:
            'Accessibility label for a button that opens a photo gallery on Grain, a photo-sharing app. "Grain" is a brand name.',
        })}
        color="primary"
        size="large"
        onPress={() => control.close(() => openLink(photo.uri))}>
        <View style={[a.p_2xs, a.rounded_xs, {backgroundColor: 'white'}]}>
          <GrainMark width={12} />
        </View>
        <ButtonText>
          <Trans comment='Button that opens a photo gallery on Grain, a photo-sharing app. "Grain" is a brand name.'>
            View on Grain
          </Trans>
        </ButtonText>
        <ButtonIcon icon={ExternalLinkIcon} size="sm" />
      </Button>
      {IS_NATIVE && (
        <Button
          testID="atmospherePhotoDialogClose"
          label={l`Close`}
          color="secondary"
          size="large"
          style={[a.w_full]}
          onPress={() => control.close()}>
          <ButtonText>
            <Trans>Close</Trans>
          </ButtonText>
        </Button>
      )}
    </View>
  )
}

function Stat({
  icon: Icon,
  testID,
  label,
}: {
  icon: React.ComponentType<{size?: 'xs'; fill?: string}>
  testID: string
  label: string
}) {
  const t = useTheme()

  return (
    <View testID={testID} style={[a.flex_row, a.align_center, a.gap_xs]}>
      <Icon size="xs" fill={t.atoms.text_contrast_medium.color} />
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>{label}</Text>
    </View>
  )
}
