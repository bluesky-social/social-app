import {useCallback, useEffect, useMemo, useState} from 'react'
import {Pressable, View} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyEmbedImages} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useCurrentAccountProfile} from '#/state/queries/useCurrentAccountProfile'
import {useSession} from '#/state/session'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {AutoSizedImage} from '#/components/images/AutoSizedImage'
import {ImageLayoutGrid} from '#/components/images/ImageLayoutGrid'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {
  type DraftPostDisplay,
  type DraftSummary,
  type LocalMediaDisplay,
} from './state/schema'
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
  meta: LocalMediaDisplay
  width?: number
  height?: number
}

function DraftMediaPreview({post}: {post: DraftPostDisplay}) {
  const t = useTheme()
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([])

  useEffect(() => {
    async function loadMedia() {
      // Try to load all images - the exists flag may be stale due to async cache
      if (post.images && post.images.length > 0) {
        const loaded: LoadedImage[] = []
        for (const image of post.images) {
          try {
            const url = await storage.loadMediaFromLocal(image.localPath)
            // Get dimensions using expo-image's loadAsync
            let width: number | undefined
            let height: number | undefined
            try {
              const imageRef = await Image.loadAsync(url)
              width = imageRef.width
              height = imageRef.height
            } catch {
              // Dimensions unavailable, will use default aspect ratio
            }
            loaded.push({url, meta: {...image, exists: true}, width, height})
          } catch (e) {
            // Image doesn't exist locally, skip it
          }
        }
        setLoadedImages(loaded)
      }
    }

    loadMedia()
  }, [post.images])

  // Convert loaded images to ViewImage format for the embed components
  const viewImages = useMemo<AppBskyEmbedImages.ViewImage[]>(() => {
    return loadedImages.map(({url, width, height, meta}) => ({
      thumb: url,
      fullsize: url,
      alt: meta.altText || '',
      aspectRatio: width && height ? {width, height} : {width: 1, height: 1},
    }))
  }, [loadedImages])

  // Count missing images (images we tried to load but couldn't)
  const missingImageCount = (post.images?.length ?? 0) - loadedImages.length

  // Nothing to show
  if (viewImages.length === 0 && !post.gif && !post.video) {
    return null
  }

  return (
    <View style={[a.pt_sm, a.pointer_events_none]}>
      {/* Images - use real embed components */}
      {viewImages.length === 1 && (
        <AutoSizedImage image={viewImages[0]} hideBadge />
      )}
      {viewImages.length > 1 && <ImageLayoutGrid images={viewImages} />}

      {/* Missing images note */}
      {missingImageCount > 0 && (
        <Text style={[a.text_xs, t.atoms.text_contrast_medium, a.mt_xs]}>
          <Trans>
            {missingImageCount} image{missingImageCount > 1 ? 's' : ''} not
            available
          </Trans>
        </Text>
      )}

      {/* GIF preview */}
      {post.gif && (
        <View
          style={[
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            {
              aspectRatio:
                post.gif.width && post.gif.height
                  ? post.gif.width / post.gif.height
                  : 16 / 9,
            },
          ]}>
          <Image
            source={{uri: post.gif.url}}
            style={[a.flex_1]}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      )}

      {/* Video indicator */}
      {post.video && (
        <View
          style={[
            a.rounded_md,
            a.p_md,
            a.align_center,
            a.justify_center,
            t.atoms.bg_contrast_50,
            {aspectRatio: 16 / 9},
          ]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {post.video.exists ? (
              <Trans>Video attached</Trans>
            ) : (
              <Trans>Video not available</Trans>
            )}
          </Text>
        </View>
      )}
    </View>
  )
}
