import {View} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Gallery from '#/components/Gallery'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {PhotoGallery} from './PhotoGallery'

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

  return (
    <Dialog.Outer control={control} testID="atmospherePhotoDialog">
      <Dialog.Handle />
      <Gallery.Bleed>
        <Dialog.ScrollableInner
          label={l`Photos: ${photo.title}`}
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
  const {t: l} = useLingui()
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  const moderation = moderationOpts
    ? moderateProfile(author, moderationOpts)
    : undefined
  const authorName = sanitizeDisplayName(
    author.displayName || sanitizeHandle(author.handle),
    moderation?.ui('displayName'),
  )
  const source = isGrainUrl(photo.uri) ? 'grain' : toNiceDomain(photo.uri)
  const createdAt = photo.createdAt
  const hasDate = !!createdAt && !Number.isNaN(Date.parse(createdAt))

  return (
    <View style={[a.gap_lg]}>
      <Text
        testID="atmospherePhotoDialogSource"
        style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>
          Powered by <Text style={[a.font_bold, a.text_sm]}>{source}</Text>
        </Trans>
      </Text>
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <UserAvatar
          type="user"
          size={40}
          avatar={author.avatar}
          moderation={moderation?.ui('avatar')}
        />
        <View style={[a.flex_1]}>
          <Text emoji style={[a.text_md, a.font_medium]} numberOfLines={1}>
            {authorName}
          </Text>
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {sanitizeHandle(author.handle, '@')}
            {hasDate ? (
              <TimeElapsed timestamp={createdAt}>
                {({timeElapsed}) => <Text>{` · ${timeElapsed}`}</Text>}
              </TimeElapsed>
            ) : null}
          </Text>
        </View>
      </View>
      <PhotoGallery photo={photo} />
      <View style={[a.gap_xs]}>
        <Text emoji style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
          {photo.title}
        </Text>
        {photo.description.trim() ? (
          <Text
            emoji
            style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
            {photo.description}
          </Text>
        ) : null}
      </View>
      <Button
        testID="atmospherePhotoDialogClose"
        label={l`Close`}
        color="secondary"
        size="large"
        onPress={() => control.close()}>
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

function isGrainUrl(uri: string) {
  try {
    const {hostname} = new URL(uri)
    return hostname === 'grain.social' || hostname.endsWith('.grain.social')
  } catch {
    return false
  }
}
