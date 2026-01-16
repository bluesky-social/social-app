import {useCallback, useEffect, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import * as MediaPreview from '#/components/MediaPreview'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {type DraftPostDisplay, type DraftSummary} from './state/schema'
import * as storage from './state/storage'

export function DraftItem({
  draft,
  onSelect,
  onDelete,
}: {
  draft: DraftSummary
  onSelect: (draft: DraftSummary) => void
  onDelete: (draft: DraftSummary) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const discardPromptControl = Prompt.usePromptControl()

  const handleDelete = useCallback(() => {
    onDelete(draft)
  }, [onDelete, draft])

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Open draft`)}
        accessibilityHint={_(msg`Opens this draft in the composer`)}
        onPress={() => onSelect(draft)}
        style={({pressed, hovered}) => [
          a.rounded_md,
          a.overflow_hidden,
          a.border,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          t.atoms.shadow_sm,
          (pressed || hovered) && t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.p_md, a.gap_sm]}>
          {/* Missing media warning */}
          {draft.hasMissingMedia && (
            <View
              style={[
                a.rounded_sm,
                a.px_sm,
                a.py_xs,
                a.mb_xs,
                t.atoms.bg_contrast_50,
              ]}>
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                <Trans>Some media unavailable (saved on another device)</Trans>
              </Text>
            </View>
          )}

          {/* Posts */}
          {draft.posts.map((post, index) => (
            <DraftPostRow
              key={post.id}
              post={post}
              isFirst={index === 0}
              isLast={index === draft.posts.length - 1}
              timestamp={draft.updatedAt}
              discardPromptControl={discardPromptControl}
            />
          ))}
        </View>
      </Pressable>

      <Prompt.Basic
        control={discardPromptControl}
        title={_(msg`Discard draft?`)}
        description={_(msg`This draft will be permanently deleted.`)}
        onConfirm={handleDelete}
        confirmButtonCta={_(msg`Discard`)}
        confirmButtonColor="negative"
      />
    </>
  )
}

function DraftPostRow({
  post,
  isFirst,
  isLast,
  timestamp,
  discardPromptControl,
}: {
  post: DraftPostDisplay
  isFirst: boolean
  isLast: boolean
  timestamp: string
  discardPromptControl: Prompt.PromptControlProps
}) {
  const {_} = useLingui()
  const t = useTheme()
  const profile = useCurrentAccountProfile()
  const {currentAccount} = useSession()

  const displayName =
    profile?.displayName || profile?.handle || currentAccount?.handle || ''
  const handle = profile?.handle || currentAccount?.handle || ''
  const avatarUrl = profile?.avatar

  return (
    <View style={[a.flex_row, a.gap_sm]}>
      {/* Avatar column with thread line */}
      <View style={[a.align_center]}>
        <UserAvatar type="user" size={42} avatar={avatarUrl} />
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
      <View style={[a.flex_1, a.gap_2xs]}>
        {/* Header row: name, handle, timestamp, menu */}
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <View style={[a.flex_row, a.align_center, a.flex_1, a.gap_xs]}>
            {displayName && (
              <Text
                style={[a.text_md, a.font_semi_bold, t.atoms.text]}
                numberOfLines={1}>
                {displayName}
              </Text>
            )}
            <Text
              style={[a.text_md, t.atoms.text_contrast_medium]}
              numberOfLines={1}>
              @{handle}
            </Text>
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              &middot;
            </Text>
            <TimeElapsed timestamp={timestamp}>
              {({timeElapsed}) => (
                <Text
                  style={[a.text_md, t.atoms.text_contrast_medium]}
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
                discardPromptControl.open()
              }}>
              <ButtonIcon icon={DotsIcon} />
            </Button>
          )}
        </View>

        {/* Post text - full, not truncated */}
        {post.text ? (
          <Text style={[a.text_md, a.leading_snug, t.atoms.text]}>
            {post.text}
          </Text>
        ) : (
          <Text
            style={[
              a.text_md,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.italic,
            ]}>
            <Trans>(No text)</Trans>
          </Text>
        )}

        {/* Media preview */}
        <DraftMediaPreview post={post} />
      </View>
    </View>
  )
}

type LoadedImage = {
  url: string
  alt: string
}

function DraftMediaPreview({post}: {post: DraftPostDisplay}) {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([])
  const [videoThumbnail, setVideoThumbnail] = useState<string | undefined>()

  useEffect(() => {
    async function loadMedia() {
      // Load images
      if (post.images && post.images.length > 0) {
        const loaded: LoadedImage[] = []
        for (const image of post.images) {
          try {
            const url = await storage.loadMediaFromLocal(image.localPath)
            loaded.push({url, alt: image.altText || ''})
          } catch (e) {
            // Image doesn't exist locally, skip it
          }
        }
        setLoadedImages(loaded)
      }

      // Load video thumbnail
      if (post.video?.exists && post.video.localPath) {
        try {
          const url = await storage.loadMediaFromLocal(post.video.localPath)
          setVideoThumbnail(url)
        } catch (e) {
          // Video doesn't exist locally
        }
      }
    }

    loadMedia()
  }, [post.images, post.video])

  // Nothing to show
  if (loadedImages.length === 0 && !post.gif && !post.video) {
    return null
  }

  return (
    <MediaPreview.Outer style={[a.pt_xs]}>
      {loadedImages.map((image, i) => (
        <MediaPreview.ImageItem key={i} thumbnail={image.url} alt={image.alt} />
      ))}
      {post.gif && (
        <MediaPreview.GifItem thumbnail={post.gif.url} alt={post.gif.alt} />
      )}
      {post.video && (
        <MediaPreview.VideoItem
          thumbnail={videoThumbnail}
          alt={post.video.altText}
        />
      )}
    </MediaPreview.Outer>
  )
}
