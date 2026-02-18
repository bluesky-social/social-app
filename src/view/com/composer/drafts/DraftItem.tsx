import {useCallback, useEffect, useMemo, useState} from 'react'
import {Pressable, View} from 'react-native'
import * as VideoThumbnails from 'expo-video-thumbnails'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as device from '#/lib/deviceName'
import {logger} from '#/view/com/composer/drafts/state/logger'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, select, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {CirclePlus_Stroke2_Corner0_Rounded as CirclePlusIcon} from '#/components/icons/CirclePlus'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {DotGrid_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {CloseQuote_Stroke2_Corner0_Rounded as CloseQuoteIcon} from '#/components/icons/Quote'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as MediaPreview from '#/components/MediaPreview'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
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
  const post = draft.posts[0]

  const mediaExistsOnOtherDevice =
    !draft.meta.isOriginatingDevice && draft.meta.hasMissingMedia
  const mediaIsMissing =
    draft.meta.isOriginatingDevice && draft.meta.hasMissingMedia
  const hasMetadata =
    draft.meta.replyCount > 0 ||
    mediaExistsOnOtherDevice ||
    draft.meta.hasQuotes

  const isUnknownDevice = useMemo(() => {
    const raw = draft.draft.deviceName
    switch (raw) {
      case device.FALLBACK_IOS:
      case device.FALLBACK_ANDROID:
      case device.FALLBACK_WEB:
        return true
      default:
        return false
    }
  }, [draft])

  const handleDelete = useCallback(() => {
    onDelete(draft)
  }, [onDelete, draft])

  return (
    <>
      <View style={[a.relative]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={_(msg`Open draft`)}
          accessibilityHint={_(msg`Opens this draft in the composer`)}
          onPress={() => onSelect(draft)}
          style={({pressed, hovered}) => [
            a.rounded_md,
            a.border,
            t.atoms.shadow_sm,
            pressed || hovered
              ? t.atoms.border_contrast_medium
              : t.atoms.border_contrast_low,
            {
              backgroundColor: select(t.name, {
                light: t.atoms.bg.backgroundColor,
                dark: t.atoms.bg_contrast_25.backgroundColor,
                dim: t.atoms.bg_contrast_25.backgroundColor,
              }),
            },
          ]}>
          <View
            style={[
              a.rounded_md,
              a.overflow_hidden,
              a.p_lg,
              a.pb_md,
              a.gap_sm,
              {
                paddingTop: 20 + a.pt_md.paddingTop,
              },
            ]}>
            {!!post.text.trim().length && (
              <RichText
                style={[a.text_md, a.leading_snug, a.pointer_events_none]}
                numberOfLines={8}
                value={post.text}
                enableTags
                disableMentionFacetValidation
              />
            )}

            {!mediaExistsOnOtherDevice && <DraftMediaPreview post={post} />}

            {hasMetadata && (
              <View style={[a.gap_xs]}>
                {mediaExistsOnOtherDevice && (
                  <DraftMetadataTag
                    icon={WarningIcon}
                    text={
                      isUnknownDevice
                        ? _(msg`Media stored on another device`)
                        : _(
                            msg({
                              message: `Media stored on ${draft.draft.deviceName}`,
                              comment: `Example: "Media stored on John's iPhone"`,
                            }),
                          )
                    }
                  />
                )}
                {mediaIsMissing && (
                  <DraftMetadataTag
                    display="warning"
                    icon={WarningIcon}
                    text={_(msg`Missing media`)}
                  />
                )}
                {draft.meta.hasQuotes && (
                  <DraftMetadataTag
                    icon={CloseQuoteIcon}
                    text={_(msg`Quote post`)}
                  />
                )}
                {draft.meta.replyCount > 0 && (
                  <DraftMetadataTag
                    icon={CirclePlusIcon}
                    text={plural(draft.meta.replyCount, {
                      one: '1 more post',
                      other: '# more posts',
                    })}
                  />
                )}
              </View>
            )}
          </View>
        </Pressable>

        {/* Timestamp */}
        <View
          pointerEvents="none"
          style={[
            a.absolute,
            a.pointer_events_none,
            {
              top: a.pt_md.paddingTop,
              left: a.pl_lg.paddingLeft,
            },
          ]}>
          <TimeElapsed timestamp={draft.updatedAt}>
            {({timeElapsed}) => (
              <Text
                style={[
                  a.text_sm,
                  t.atoms.text_contrast_medium,
                  a.leading_tight,
                ]}
                numberOfLines={1}>
                {timeElapsed}
              </Text>
            )}
          </TimeElapsed>
        </View>

        {/* Menu button */}
        <View
          style={[
            a.absolute,
            {
              top: a.pt_md.paddingTop,
              right: a.pr_md.paddingRight,
            },
          ]}>
          <Button
            label={_(msg`More options`)}
            hitSlop={8}
            onPress={e => {
              e.stopPropagation()
              discardPromptControl.open()
            }}
            style={[
              a.pointer,
              a.rounded_full,
              {
                height: 20,
                width: 20,
              },
            ]}>
            {({pressed, hovered}) => (
              <>
                <View
                  style={[
                    a.absolute,
                    a.rounded_full,
                    {
                      top: -4,
                      bottom: -4,
                      left: -4,
                      right: -4,
                      backgroundColor:
                        pressed || hovered
                          ? select(t.name, {
                              light: t.atoms.bg_contrast_50.backgroundColor,
                              dark: t.atoms.bg_contrast_100.backgroundColor,
                              dim: t.atoms.bg_contrast_100.backgroundColor,
                            })
                          : 'transparent',
                    },
                  ]}
                />
                <DotsIcon
                  width={16}
                  fill={t.atoms.text_contrast_low.color}
                  style={[a.z_20]}
                />
              </>
            )}
          </Button>
        </View>
      </View>

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

function DraftMetadataTag({
  display = 'info',
  icon: Icon,
  text,
}: {
  display?: 'info' | 'warning'
  icon: React.ComponentType<SVGIconProps>
  text: string
}) {
  const t = useTheme()
  const color = {
    info: t.atoms.text_contrast_medium.color,
    warning: select(t.name, {
      light: '#C99A00',
      dark: '#FFC404',
      dim: '#FFC404',
    }),
  }[display]
  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <Icon size="sm" fill={color} />
      <Text style={[a.text_sm, a.leading_tight, {color}]}>{text}</Text>
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

      if (post.video?.exists && post.video.localPath) {
        try {
          const url = await storage.loadMediaFromLocal(post.video.localPath)
          if (IS_WEB) {
            // can't generate thumbnails on web
            setVideoThumbnail("yep, there's a video")
          } else {
            logger.debug('generating thumbnail of ', {url})
            const thumbnail = await VideoThumbnails.getThumbnailAsync(url, {
              time: 0,
              quality: 0.2,
            })
            logger.debug('thumbnail generated', {thumbnail})
            setVideoThumbnail(thumbnail.uri)
          }
        } catch (e) {
          // Video doesn't exist locally
        }
      }
    }

    void loadMedia()
  }, [post.images, post.video])

  // Nothing to show
  if (loadedImages.length === 0 && !post.gif && !post.video) {
    return null
  }

  return (
    <MediaPreview.Outer>
      {loadedImages.map((image, i) => (
        <MediaPreview.ImageItem key={i} thumbnail={image.url} alt={image.alt} />
      ))}
      {post.gif && (
        <MediaPreview.GifItem thumbnail={post.gif.url} alt={post.gif.alt} />
      )}
      {post.video && videoThumbnail && (
        <MediaPreview.VideoItem
          thumbnail={IS_WEB ? undefined : videoThumbnail}
          alt={post.video.altText}
        />
      )}
    </MediaPreview.Outer>
  )
}
