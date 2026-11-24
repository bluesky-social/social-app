import {useEffect, useRef, useState} from 'react'
import {Image, StyleSheet, View} from 'react-native'
import Svg, {Defs, Ellipse, RadialGradient, Stop} from 'react-native-svg'
import {Image as ExpoImage} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {moderatePost} from '@bsky/sdk/moderation'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'
import {useLingui} from '@lingui/react/macro'

import {convertCdnPreset} from '#/lib/media/util'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Logomark} from '#/view/icons/Logomark'
import {LogomarkWithType} from '#/view/icons/LogomarkWithType'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Bubble_Stroke2_Corner2_Rounded as ReplyIcon} from '#/components/icons/Bubble'
import {Heart2_Stroke2_Corner0_Rounded as LikeIcon} from '#/components/icons/Heart2'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {STORY_HEIGHT, STORY_WIDTH, type StorySky} from '../const'
import {getQuotedPostView} from '../useCanSharePostImage'

/*
 * The layout comes from the design's 1080x1920 story template (the one our ads
 * use). Its graphics (card, avatar, logo) are its sizes divided by three, since
 * the story is laid out at 360x640 and captured at 3x. Text and spacing use
 * ALF's sizes, which are close.
 */

/** The ad's card colors, used on the day sky. */
const DAY_CARD = {
  background: '#FFFFFF',
  text: '#232E3E',
  muted: '#8492A6',
  hairline: '#EBEEF2',
  /** Edge around the card. The white card needs none on the blue sky. */
  outline: 'transparent',
}

type CardColors = typeof DAY_CARD

/**
 * The card's colors: the ad's on the day sky, the app's Dim theme at night.
 * Must be called inside the card's ThemeProvider.
 */
function useCardColors(sky: StorySky): CardColors {
  const t = useTheme()
  if (sky === 'day') return DAY_CARD
  return {
    background: t.atoms.bg.backgroundColor,
    text: t.atoms.text.color,
    muted: t.atoms.text_contrast_medium.color,
    hairline: t.atoms.border_contrast_low.borderColor,
    // A light edge so the dark card separates from the night sky
    outline: 'rgba(255,255,255,0.16)',
  }
}
const BLUE = '#0560FF'

/*
 * Areas Instagram's story UI covers, kept clear of the card and logo. Tighter
 * than the ad's (Meta's ad zones), since a story only has the progress bar and
 * name at the top and the reply bar at the bottom.
 */
const SAFE_TOP = STORY_HEIGHT * 0.11
const SAFE_SIDE = STORY_WIDTH * 0.06
/*
 * Short posts sit a little above the middle; bigger ones may grow down toward
 * the reply bar.
 */
const SAFE_BOTTOM = STORY_HEIGHT * 0.2
const SAFE_BOTTOM_HEAVY = STORY_HEIGHT * 0.1

const CARD_WIDTH = Math.min(STORY_WIDTH * 0.84, STORY_WIDTH - SAFE_SIDE * 2)
/**
 * How much to grow the card and logo so the card fills the width between the
 * side margins. Tall posts shrink from there until they fit.
 */
const FILL_WIDTH_SCALE = (STORY_WIDTH - SAFE_SIDE * 2) / CARD_WIDTH
const LOGO_WIDTH = STORY_WIDTH * 0.3
const LOGO_HEIGHT = LOGO_WIDTH * (17 / 64)
const LOGO_GAP = Math.max(LOGO_HEIGHT * 1.1, 56 / 3)
/**
 * How narrow a post's photos or link card can get to make room. Past this,
 * the whole card shrinks instead.
 */
const MIN_MEDIA_SCALE = 0.5
/** Lines of text kept when the post also has media or a quote. */
const MAX_LINES_WITH_EMBED = 6
/** Lines of a quoted post's text. */
const MAX_QUOTE_LINES = 4

const SKIES: Record<
  StorySky,
  {
    gradient: [string, string]
    /** Opacity of the far haze, main sky and low cloud bank. */
    clouds: [number, number, number]
    /** The color and strength of the soft glow behind the logo. */
    glow: {color: string; opacity: number}
  }
> = {
  day: {
    gradient: ['#0560FF', '#75AFFF'],
    clouds: [0.7, 1, 1],
    glow: {color: '#0560FF', opacity: 0.3},
  },
  night: {
    gradient: ['#020A26', '#0E3378'],
    clouds: [0.18, 0.32, 0.42],
    // Barely there: a dark glow reads as a smudge on the night sky
    glow: {color: '#020A26', opacity: 0.1},
  },
}

const CLOUDS = require('../../../../assets/images/story_clouds.webp')
const CLOUD_LAYER_COUNT = 3
/**
 * How long to wait for the post's photos and avatars before showing the story
 * anyway, so a slow or broken image can't hold the screen up for good.
 */
const IMAGE_WAIT_MS = 8000

/**
 * A post as a story: the post on a card over a Bluesky sky, with the Bluesky
 * logo under it. Matches the ad generator's 9:16 story. Laid out at
 * `STORY_WIDTH` x `STORY_HEIGHT`; capture it at `STORY_PIXEL_RATIO` with
 * `ref`.
 */
export function StoryImage({
  ref,
  post,
  sky,
  onReady,
}: {
  ref?: React.Ref<React.ComponentRef<typeof View>>
  post: app.bsky.feed.defs.PostView
  sky: StorySky
  /**
   * Called once the clouds and the post's images have loaded. Until then the
   * sky is a bare gradient and photos are blank, so hold off showing or
   * capturing the image.
   */
  onReady?: () => void
}) {
  const [isSkyReady, setIsSkyReady] = useState(false)
  const isImagesReady = usePrefetchedImages(post)
  const hasCalledReady = useRef(false)
  useEffect(() => {
    if (!isSkyReady || !isImagesReady || hasCalledReady.current) return
    hasCalledReady.current = true
    onReady?.()
  })

  const record = bsky.isType(app.bsky.feed.post, post.record)
    ? post.record
    : undefined
  const text = record?.text ?? ''
  const heavy = !!post.embed || text.length > 140
  const safeBottom = heavy ? SAFE_BOTTOM_HEAVY : SAFE_BOTTOM
  const available = STORY_HEIGHT - SAFE_TOP - safeBottom
  /*
   * A post that's too tall for the space first narrows its media, which keeps
   * its aspect ratio and so gets shorter, rather than shrinking all its text.
   * Whatever's still too tall then shrinks as a whole, so nothing gets cut
   * off.
   */
  const [groupHeight, setGroupHeight] = useState(0)
  const [media, setMedia] = useState({height: 0, fullHeight: 0})
  /** The tallest the group can be at full scale. */
  const maxGroupHeight = available / FILL_WIDTH_SCALE
  /** Everything but the media, which doesn't change as the media narrows. */
  const restHeight = groupHeight - media.height
  const mediaScale =
    media.fullHeight > 0 && groupHeight > 0
      ? Math.min(
          1,
          Math.max(
            MIN_MEDIA_SCALE,
            (maxGroupHeight - restHeight) / media.fullHeight,
          ),
        )
      : 1
  const onMediaLayout = (height: number) =>
    setMedia(prev => ({
      height,
      // Measured before any narrowing, then kept
      fullHeight: prev.fullHeight || height,
    }))
  const fit =
    groupHeight > 0
      ? Math.min(FILL_WIDTH_SCALE, available / groupHeight)
      : FILL_WIDTH_SCALE

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[a.overflow_hidden, {width: STORY_WIDTH, height: STORY_HEIGHT}]}>
      <Sky sky={sky} onReady={() => setIsSkyReady(true)} />

      <View
        style={[
          a.absolute,
          a.align_center,
          a.justify_center,
          {
            top: SAFE_TOP,
            bottom: safeBottom,
            left: SAFE_SIDE,
            right: SAFE_SIDE,
          },
        ]}>
        <View
          onLayout={e => setGroupHeight(e.nativeEvent.layout.height)}
          style={[a.align_center, {transform: [{scale: fit}]}]}>
          {/* Light by day, dark at night, whatever the app's own theme */}
          <ThemeProvider theme={sky === 'night' ? 'dim' : 'light'}>
            <StoryCard
              post={post}
              text={text}
              record={record}
              sky={sky}
              mediaScale={mediaScale}
              onMediaLayout={onMediaLayout}
            />
          </ThemeProvider>
          <Logo sky={sky} />
        </View>
      </View>
    </View>
  )
}

function Sky({sky, onReady}: {sky: StorySky; onReady?: () => void}) {
  const {gradient, clouds} = SKIES[sky]
  const loadedLayers = useRef(0)
  /*
   * A layer that fails to load counts too: a sky without one is better than
   * a screen that never finishes loading.
   */
  const onLayerLoad = () => {
    loadedLayers.current += 1
    if (loadedLayers.current === CLOUD_LAYER_COUNT) onReady?.()
  }
  return (
    <>
      <LinearGradient
        colors={gradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      {sky === 'night' && <Stars />}
      {/*
       * Three layers of the same clouds, like the ad: a soft, distant haze,
       * the main sky, then a bank rising from the bottom. They're pushed down
       * so the top stays open sky.
       */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {transform: [{translateY: STORY_HEIGHT * 0.24}]},
        ]}>
        {/* Bigger than the frame, so no layer's edge shows */}
        <CloudLayer
          size={720}
          left={-180}
          top={-170}
          opacity={clouds[0]}
          blur={2}
          onLoad={onLayerLoad}
        />
        <CloudLayer
          size={660}
          left={-150}
          top={-110}
          opacity={clouds[1]}
          onLoad={onLayerLoad}
        />
        <CloudLayer
          size={620}
          left={-130}
          top={STORY_HEIGHT - 620 * 0.62}
          opacity={clouds[2]}
          flip
          onLoad={onLayerLoad}
        />
      </View>
    </>
  )
}

function CloudLayer({
  size,
  left,
  top,
  opacity,
  blur,
  flip,
  onLoad,
}: {
  size: number
  left: number
  top: number
  opacity: number
  blur?: number
  flip?: boolean
  onLoad?: () => void
}) {
  return (
    <Image
      source={CLOUDS}
      accessibilityIgnoresInvertColors
      blurRadius={blur}
      onLoad={onLoad}
      onError={onLoad}
      style={[
        a.absolute,
        {
          width: size,
          height: size,
          left,
          top,
          opacity,
          transform: flip ? [{scaleX: -1}] : undefined,
        },
      ]}
    />
  )
}

/** Fixed, so the night sky looks the same every time. */
const STARS = Array.from({length: 46}, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return {
    left: r(1) * STORY_WIDTH,
    top: r(2) * STORY_HEIGHT * 0.55,
    size: r(3) < 0.15 ? 2 : r(3) < 0.5 ? 1.4 : 1,
    opacity: 0.35 + r(4) * 0.6,
  }
})

function Stars() {
  return (
    <>
      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            a.absolute,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
              backgroundColor: '#FFFFFF',
            },
          ]}
        />
      ))}
    </>
  )
}

function StoryCard({
  post,
  text,
  record,
  sky,
  mediaScale,
  onMediaLayout,
}: {
  post: app.bsky.feed.defs.PostView
  text: string
  record: app.bsky.feed.post.Main | undefined
  sky: StorySky
  /** How wide the media is drawn, as a share of the card's width. */
  mediaScale: number
  /** Called with the media's height whenever it's laid out. */
  onMediaLayout: (height: number) => void
}) {
  const c = useCardColors(sky)
  const {i18n} = useLingui()
  const moderationOpts = useModerationOpts()
  const moderation = moderationOpts
    ? moderatePost(post, moderationOpts)
    : undefined
  const displayName = createSanitizedDisplayName(
    post.author,
    false,
    moderation?.ui('displayName'),
  )
  const verification = useSimpleVerificationState({profile: post.author})
  const richText = new RichTextAPI({text, facets: record?.facets})
  const {media, quoted} = getStoryEmbed(post)
  // Short posts get bigger type, like the ad
  const textSize = text.length < 160 ? a.text_md : a.text_sm

  const stats = [
    {key: 'like', icon: LikeIcon, count: post.likeCount ?? 0},
    {key: 'reply', icon: ReplyIcon, count: post.replyCount ?? 0},
    {key: 'repost', icon: RepostIcon, count: post.repostCount ?? 0},
  ].filter(stat => stat.count > 0)

  return (
    <View
      style={{
        width: CARD_WIDTH,
        paddingTop: 44 / 3,
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderRadius: 80 / 3,
        borderCurve: 'continuous',
        backgroundColor: c.background,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: c.outline,
        shadowColor: '#002878',
        shadowOpacity: 0.28,
        shadowRadius: 27,
        shadowOffset: {width: 0, height: 10},
      }}>
      <Butterfly />
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          a.mb_sm,
          {paddingRight: 88 / 3},
        ]}>
        <UserAvatar
          avatar={post.author.avatar}
          size={92 / 3}
          type={post.author.associated?.labeler ? 'labeler' : 'user'}
          moderation={moderation?.ui('avatar')}
        />
        <View style={[a.flex_1]}>
          <View style={[a.flex_row, a.align_center]}>
            <Text
              emoji
              numberOfLines={1}
              style={[a.flex_shrink, a.text_sm, a.font_bold, {color: c.text}]}>
              {displayName}
            </Text>
            {/*
             * Just the checkmark: other badges (like beta) only mean something
             * inside the app.
             */}
            {verification.showBadge && (
              <View style={[a.pl_2xs]}>
                <VerificationCheck
                  verifier={verification.role === 'verifier'}
                  width={10}
                />
              </View>
            )}
          </View>
          <Text numberOfLines={1} style={[a.text_xs, {color: c.muted}]}>
            {sanitizeHandle(post.author.handle, '@')}
          </Text>
        </View>
      </View>

      {text.trim() ? (
        <RichText
          value={richText}
          disableLinks
          numberOfLines={media || quoted ? MAX_LINES_WITH_EMBED : undefined}
          style={[textSize, a.leading_snug, {color: c.text}]}
        />
      ) : null}

      {media ? (
        <View
          style={[a.mt_sm, a.align_center]}
          onLayout={e => onMediaLayout(e.nativeEvent.layout.height)}>
          <View style={{width: `${mediaScale * 100}%`}}>
            <Embed
              embed={forStoryImage(media)}
              moderation={moderation}
              viewContext={PostEmbedViewContext.Feed}
              allowNestedQuotes={false}
            />
          </View>
        </View>
      ) : null}
      {quoted ? <StoryQuote quoted={quoted} colors={c} /> : null}

      <Text style={[a.mt_sm, a.text_2xs, {color: c.muted}]}>
        {i18n.date(new Date(post.indexedAt), {dateStyle: 'long'})}
      </Text>

      {/* Counts on the left, the site the post lives on at the right */}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_md,
          a.mt_xs,
          {
            paddingTop: 6,
            borderTopWidth: 1,
            borderTopColor: c.hairline,
          },
        ]}>
        {stats.map(({key, icon: Icon, count}) => (
          <View key={key} style={[a.flex_row, a.align_center, a.gap_xs]}>
            <Icon width={44 / 3} fill={c.text} />
            <Text style={[a.text_2xs, a.font_semi_bold, {color: c.text}]}>
              {formatCount(i18n, count)}
            </Text>
          </View>
        ))}
        <Text
          style={[
            a.text_2xs,
            a.font_medium,
            // The date's size, the counts' color
            {marginLeft: 'auto', color: c.text},
          ]}>
          bsky.app
        </Text>
      </View>
    </View>
  )
}

/**
 * The embed made ready for the story image: alt text cleared, so photos don't
 * show the ALT badge in the picture (the text stays on the original post),
 * photos swapped to their full-size versions, since the feed's smaller ones
 * look soft at 1080x1920, and videos drawn as their still thumbnail rather
 * than a live player.
 */
function forStoryImage(
  embed: NonNullable<app.bsky.feed.defs.PostView['embed']>,
): NonNullable<app.bsky.feed.defs.PostView['embed']> {
  if (bsky.isType(app.bsky.embed.images.view, embed)) {
    return {
      ...embed,
      images: embed.images.map(img => ({...img, alt: '', thumb: img.fullsize})),
    }
  }
  if (bsky.isType(app.bsky.embed.video.view, embed)) {
    return {
      $type: 'app.bsky.embed.images#view' as const,
      images: embed.thumbnail
        ? [
            {
              thumb: embed.thumbnail,
              fullsize: embed.thumbnail,
              alt: '',
              aspectRatio: embed.aspectRatio,
            },
          ]
        : [],
    }
  }
  return embed
}

/**
 * Downloads the post's photos and avatars ahead of time, and says when
 * they're in (or `IMAGE_WAIT_MS` has passed), so they're drawn into the image
 * rather than left blank.
 */
function usePrefetchedImages(post: app.bsky.feed.defs.PostView) {
  const [isDone, setIsDone] = useState(() => getImageUrls(post).length === 0)
  useEffect(() => {
    const urls = getImageUrls(post)
    if (!urls.length) return
    let cancelled = false
    const done = () => {
      if (!cancelled) setIsDone(true)
    }
    const timer = setTimeout(done, IMAGE_WAIT_MS)
    ExpoImage.prefetch(urls, 'memory-disk').then(done, done)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [post])
  return isDone
}

/**
 * The URLs the story draws: avatars at the size `UserAvatar` asks for, and
 * the embed's photos, link card or video thumbnail as `forStoryImage` leaves
 * them.
 */
function getImageUrls(post: app.bsky.feed.defs.PostView): string[] {
  const urls: string[] = []
  const addAvatar = (avatar?: string) => {
    if (avatar) urls.push(convertCdnPreset(avatar, 'avatar_thumbnail'))
  }
  const addMedia = (embed: unknown) => {
    if (bsky.isType(app.bsky.embed.images.view, embed)) {
      urls.push(...embed.images.map(img => img.fullsize))
    } else if (bsky.isType(app.bsky.embed.video.view, embed)) {
      if (embed.thumbnail) urls.push(embed.thumbnail)
    } else if (bsky.isType(app.bsky.embed.external.view, embed)) {
      if (embed.external.thumb) urls.push(embed.external.thumb)
    }
  }
  addAvatar(post.author.avatar)
  const {media, quoted} = getStoryEmbed(post)
  addMedia(media)
  // A quote is drawn as its author and text, without its own media
  addAvatar(quoted?.author.avatar)
  return urls
}

type QuotedPost = {
  author: app.bsky.actor.defs.ProfileViewBasic
  text: string
  /** The quote as a post view, to moderate its author's avatar and name. */
  view: app.bsky.feed.defs.PostView
}

/**
 * Splits the post's embed into what the story draws: its media (photos,
 * video, link card) with the app's embed, and a quoted post as the ad's quote
 * card. Anything else quoted, like a feed, counts as media.
 */
function getStoryEmbed(post: app.bsky.feed.defs.PostView): {
  media?: NonNullable<app.bsky.feed.defs.PostView['embed']>
  quoted?: QuotedPost
} {
  const embed = post.embed
  if (!embed) return {}
  const view = getQuotedPostView(post)
  const value = view?.record as {text?: string} | undefined
  const quoted = view
    ? {author: view.author, text: value?.text ?? '', view}
    : undefined
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, embed)) {
    return {media: embed.media, quoted}
  }
  if (bsky.isType(app.bsky.embed.record.view, embed)) {
    return quoted ? {quoted} : {media: embed}
  }
  return {media: embed}
}

function StoryQuote({
  quoted,
  colors: c,
}: {
  quoted: QuotedPost
  colors: CardColors
}) {
  const moderationOpts = useModerationOpts()
  // Its own moderation: the quoting post's would only downgrade these labels
  const moderation = moderationOpts
    ? moderatePost(quoted.view, moderationOpts)
    : undefined
  const name = createSanitizedDisplayName(
    quoted.author,
    false,
    moderation?.ui('displayName'),
  )
  return (
    <View
      style={[
        a.mt_sm,
        a.py_sm,
        a.px_sm,
        {
          borderWidth: 1,
          borderColor: c.hairline,
          borderRadius: 14,
          borderCurve: 'continuous',
        },
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.mb_xs]}>
        <UserAvatar
          avatar={quoted.author.avatar}
          size={40 / 3}
          moderation={moderation?.ui('avatar')}
          type={quoted.author.associated?.labeler ? 'labeler' : 'user'}
        />
        <Text
          emoji
          numberOfLines={1}
          style={[a.flex_shrink, a.text_2xs, a.font_bold, {color: c.text}]}>
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={[a.flex_shrink, a.text_2xs, {color: c.muted}]}>
          {sanitizeHandle(quoted.author.handle, '@')}
        </Text>
      </View>
      <Text
        emoji
        numberOfLines={MAX_QUOTE_LINES}
        style={[a.text_sm, a.leading_snug, {color: c.text}]}>
        {quoted.text}
      </Text>
    </View>
  )
}

/** The blue butterfly in the card's top right, as in the ad. */
function Butterfly() {
  return (
    <View style={[a.absolute, {top: 18, right: 18, zIndex: 2}]}>
      <Logomark width={64 / 3} fill={BLUE} />
    </View>
  )
}

function Logo({sky}: {sky: StorySky}) {
  const glowWidth = LOGO_WIDTH * 2.2
  const glowHeight = LOGO_HEIGHT * 5
  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        {marginTop: LOGO_GAP, width: LOGO_WIDTH, height: LOGO_HEIGHT},
      ]}>
      {/* A soft glow keeps the white logo readable over clouds */}
      <Svg
        width={glowWidth}
        height={glowHeight}
        style={[
          a.absolute,
          {
            left: (LOGO_WIDTH - glowWidth) / 2,
            top: (LOGO_HEIGHT - glowHeight) / 2,
          },
        ]}>
        <Defs>
          <RadialGradient id="story-logo-glow" cx="50%" cy="50%" r="50%">
            <Stop
              offset="0"
              stopColor={SKIES[sky].glow.color}
              stopOpacity={SKIES[sky].glow.opacity}
            />
            <Stop
              offset="1"
              stopColor={SKIES[sky].glow.color}
              stopOpacity={0}
            />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={glowWidth / 2}
          cy={glowHeight / 2}
          rx={glowWidth / 2}
          ry={glowHeight / 2}
          fill="url(#story-logo-glow)"
        />
      </Svg>
      <LogomarkWithType width={LOGO_WIDTH} fill="#FFFFFF" />
    </View>
  )
}
