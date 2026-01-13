import {useEffect, useState} from 'react'
import {Image, Pressable, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {type DraftPostDisplay, type DraftSummary} from '#/state/drafts'
import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Text} from '#/components/Typography'

// Platform-specific storage import
const storage = isNative
  ? require('#/state/drafts/storage')
  : require('#/state/drafts/storage.web')

export function DraftItem({
  draft,
  onSelect,
  onDelete,
  isDeleting,
}: {
  draft: DraftSummary
  onSelect: (draft: DraftSummary) => void
  onDelete: (draftId: string) => void
  isDeleting: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={_(msg`Open draft`)}
      accessibilityHint={_(msg`Opens this draft in the composer`)}
      onPress={() => onSelect(draft)}
      style={({pressed, hovered}) => [
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg,
        (pressed || hovered) && t.atoms.bg_contrast_25,
      ]}>
      <View style={[a.p_md, a.gap_sm]}>
        {/* Reply indicator */}
        {draft.isReply && draft.replyToHandle && (
          <Text
            style={[a.text_xs, t.atoms.text_contrast_medium, a.pb_2xs]}
            numberOfLines={1}>
            <Trans>Replying to @{draft.replyToHandle}</Trans>
          </Text>
        )}

        {/* Posts */}
        {draft.posts.map((post, index) => (
          <DraftPostRow
            key={post.id}
            post={post}
            isFirst={index === 0}
            isLast={index === draft.posts.length - 1}
            timestamp={draft.updatedAt}
            draftId={draft.id}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ))}
      </View>
    </Pressable>
  )
}

function DraftPostRow({
  post,
  isFirst,
  isLast,
  timestamp,
  draftId,
  onDelete,
  isDeleting,
}: {
  post: DraftPostDisplay
  isFirst: boolean
  isLast: boolean
  timestamp: string
  draftId: string
  onDelete: (draftId: string) => void
  isDeleting: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const profile = useCurrentAccountProfile()
  const {currentAccount} = useSession()

  const displayName =
    profile?.displayName || profile?.handle || currentAccount?.handle || ''
  const handle = profile?.handle || currentAccount?.handle || ''
  const avatarUrl = profile?.avatar

  // Nested posts (not first) have smaller styling
  const avatarSize = isFirst ? 42 : 32
  const textStyle = isFirst ? a.text_md : a.text_sm

  return (
    <View style={[a.flex_row, a.gap_sm, !isFirst && [a.ml_xl, a.pt_xs]]}>
      {/* Avatar column with thread line */}
      <View style={[a.align_center]}>
        <UserAvatar type="user" size={avatarSize} avatar={avatarUrl} />
        {/* Thread line connecting posts */}
        {!isLast && (
          <View
            style={[
              a.flex_1,
              a.mt_xs,
              {
                width: 2,
                backgroundColor: t.palette.contrast_100,
                minHeight: 8,
              },
            ]}
          />
        )}
      </View>

      {/* Content column */}
      <View style={[a.flex_1, a.gap_xs]}>
        {/* Header row: name, handle, timestamp, menu */}
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <View style={[a.flex_row, a.align_center, a.flex_1, a.gap_xs]}>
            {displayName && (
              <Text
                style={[textStyle, a.font_bold, t.atoms.text]}
                numberOfLines={1}>
                {displayName}
              </Text>
            )}
            <Text
              style={[textStyle, t.atoms.text_contrast_medium]}
              numberOfLines={1}>
              @{handle}
            </Text>
            <Text style={[textStyle, t.atoms.text_contrast_medium]}>
              &middot;
            </Text>
            <TimeElapsed timestamp={timestamp}>
              {({timeElapsed}) => (
                <Text
                  style={[textStyle, t.atoms.text_contrast_medium]}
                  numberOfLines={1}>
                  {timeElapsed}
                </Text>
              )}
            </TimeElapsed>
          </View>

          {/* Overflow menu (only on first post) */}
          {isFirst && (
            <Button
              label={_(msg`More options`)}
              variant="ghost"
              color="secondary"
              shape="round"
              size="tiny"
              onPress={e => {
                e.stopPropagation()
                // TODO: Show menu with options
              }}>
              <ButtonIcon icon={DotsIcon} />
            </Button>
          )}
        </View>

        {/* Post text - full, not truncated */}
        {post.text ? (
          <Text style={[textStyle, t.atoms.text]}>{post.text}</Text>
        ) : (
          <Text style={[textStyle, t.atoms.text_contrast_medium, a.italic]}>
            <Trans>(No text)</Trans>
          </Text>
        )}

        {/* Media preview */}
        <DraftMediaPreview post={post} />

        {/* Delete button (only on last post) */}
        {isLast && (
          <View style={[a.flex_row, a.justify_end, a.pt_xs]}>
            <Button
              label={_(msg`Delete draft`)}
              variant="ghost"
              color="negative"
              shape="round"
              size="small"
              disabled={isDeleting}
              onPress={e => {
                e.stopPropagation()
                onDelete(draftId)
              }}>
              <ButtonIcon icon={TrashIcon} />
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

function DraftMediaPreview({post}: {post: DraftPostDisplay}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [gifUrl, setGifUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadMedia() {
      if (!currentAccount?.did) return

      // Load images
      if (post.images && post.images.length > 0) {
        const urls: string[] = []
        for (const image of post.images) {
          try {
            const url = await storage.loadMediaFromLocal(
              currentAccount.did,
              image.localId,
            )
            urls.push(url)
          } catch (e) {
            // Image might not exist anymore
            console.warn('Failed to load draft image', e)
          }
        }
        setImageUrls(urls)
      }

      // GIFs have a URL directly
      if (post.gif) {
        setGifUrl(post.gif.url)
      }
    }

    loadMedia()
  }, [currentAccount?.did, post.images, post.gif])

  // Nothing to show
  if (imageUrls.length === 0 && !gifUrl && !post.video) {
    return null
  }

  return (
    <View style={[a.gap_xs, a.pt_xs]}>
      {/* Images grid */}
      {imageUrls.length > 0 && (
        <View style={[a.flex_row, a.gap_xs, a.flex_wrap]}>
          {imageUrls.map((url, index) => (
            <View
              key={index}
              style={[
                a.rounded_sm,
                a.overflow_hidden,
                t.atoms.bg_contrast_25,
                {
                  width: imageUrls.length === 1 ? '100%' : '48%',
                  aspectRatio: imageUrls.length === 1 ? 16 / 9 : 1,
                },
              ]}>
              <Image
                source={{uri: url}}
                style={[a.flex_1]}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
          ))}
        </View>
      )}

      {/* GIF preview */}
      {gifUrl && (
        <View
          style={[
            a.rounded_sm,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            {aspectRatio: 16 / 9},
          ]}>
          <Image
            source={{uri: gifUrl}}
            style={[a.flex_1]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      )}

      {/* Video indicator */}
      {post.video && (
        <View
          style={[
            a.rounded_sm,
            a.p_md,
            a.align_center,
            a.justify_center,
            t.atoms.bg_contrast_50,
            {aspectRatio: 16 / 9},
          ]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            <Trans>Video attached</Trans>
          </Text>
        </View>
      )}
    </View>
  )
}
