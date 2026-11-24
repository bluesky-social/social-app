import {useRef, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import {isActorHidden} from '#/screens/Atmosphere/ActivityTab/moderation'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {
  getAssociatedProfile,
  getGalleryImages,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {useLogContentPress} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AtmosphereFirstActionWelcomeDialog} from '#/components/atmosphere/AtmosphereFirstActionWelcomeDialog'
import {useAtmosphereLike} from '#/components/atmosphere/likes'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon} from '#/components/Button'
import * as Gallery from '#/components/Gallery'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilledIcon,
  Heart2_Stroke2_Corner0_Rounded as HeartIcon,
} from '#/components/icons/Heart2'
import {getAspectRatio} from '#/components/images/Gallery/utils'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {type app, social} from '#/lexicons'
import {type ActivityContent} from '../rows'

/** Keeps a lone photo between square and 16:9. */
const MIN_SINGLE_ASPECT_RATIO = 1
const MAX_SINGLE_ASPECT_RATIO = 16 / 9
/** Keeps very tall photos in the carousel from becoming slivers. */
const MIN_CAROUSEL_ASPECT_RATIO = 1 / 2
/**
 * The widest a carousel photo gets, as a share of the card, so the next one
 * peeks in.
 */
const MAX_CAROUSEL_WIDTH = 0.85

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.6)'

type GalleryImage = ReturnType<typeof getGalleryImages>[number]

/**
 * A Grain gallery: its photos, a favorite button with known favoriters, and
 * its title, description and date. Everything but the buttons opens the
 * gallery on Grain, in the app when it's installed.
 */
export function GalleryCard({
  content: {view},
}: {
  content: Extract<ActivityContent, {type: 'gallery'}>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {state: interacted, onIn, onOut} = useInteractionState()
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  const images = getGalleryImages(view)
  const author = getAssociatedProfile(view.associatedProfiles)

  // `toActivityRows` already turns galleries without these into warnings.
  if (images.length === 0 || !author) return null

  const linkProps: PhotoLinkProps = {
    to: view.uri,
    preferNativeApp: true,
    accessibilityHint: '',
    onPress: () => {
      logPress('external')
      sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
    },
    onHoverIn: onIn,
    onHoverOut: onOut,
    onFocus: onIn,
    onBlur: onOut,
  }

  return (
    <View
      testID="activityGalleryCard"
      style={[
        a.w_full,
        a.overflow_hidden,
        a.rounded_lg,
        a.border,
        t.atoms.bg,
        interacted
          ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_high]
          : t.atoms.border_contrast_low,
      ]}>
      {images.length === 1 ? (
        <SinglePhoto image={images[0]} linkProps={linkProps} />
      ) : (
        <PhotoCarousel images={images} linkProps={linkProps} />
      )}
      <View style={[a.flex_row, a.align_center, a.gap_md, a.px_md, a.pt_sm]}>
        <FavoriteButton view={view} />
        <KnownFavoriters view={view} interacted={interacted} />
        <View style={a.flex_1} />
        <AtmosphereCardMenu
          inline
          type="photo"
          item={view}
          reportableTypes={[social.grain.gallery.$type]}
          author={author}
        />
      </View>
      <Link
        {...linkProps}
        testID="activityGalleryCardLink"
        label={l({
          message: `Open gallery: ${view.title}`,
          comment:
            'Accessibility label for a link that opens a photo gallery. {title} is the gallery title, written by its author.',
        })}
        style={[
          a.flex_col,
          a.align_stretch,
          a.gap_sm,
          a.px_md,
          a.pt_xs,
          a.pb_md,
        ]}>
        {!!view.title && (
          <Text
            emoji
            numberOfLines={2}
            style={[a.text_md, a.font_bold, a.leading_snug]}>
            {view.title}
          </Text>
        )}
        {!!view.description.trim() && (
          <Text
            emoji
            numberOfLines={3}
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            {view.description}
          </Text>
        )}
        <MetaLine view={view} />
      </Link>
    </View>
  )
}

/** What every link in the card shares: they all open the gallery. */
type PhotoLinkProps = {
  to: string
  preferNativeApp: boolean
  accessibilityHint: string
  onPress: () => void
  onHoverIn: () => void
  onHoverOut: () => void
  onFocus: () => void
  onBlur: () => void
}

function usePhotoLabel(total: number) {
  const {t: l} = useLingui()
  return (image: GalleryImage, index: number) => {
    const position = index + 1
    return (
      image.alt ||
      l({
        message: `Photo ${position} of ${total}`,
        comment:
          'Accessibility label for a photo that has no description. {position} is its 1-based number in the gallery and {total} is how many photos the gallery has.',
      })
    )
  }
}

/** A lone photo, at its own aspect ratio within reason. */
function SinglePhoto({
  image,
  linkProps,
}: {
  image: GalleryImage
  linkProps: PhotoLinkProps
}) {
  const t = useTheme()
  const getLabel = usePhotoLabel(1)
  const aspectRatio = Math.min(
    Math.max(getAspectRatio(image.aspectRatio) ?? 1, MIN_SINGLE_ASPECT_RATIO),
    MAX_SINGLE_ASPECT_RATIO,
  )

  return (
    <Link
      {...linkProps}
      label={getLabel(image, 0)}
      style={[a.w_full, t.atoms.bg_contrast_25, {aspectRatio}]}>
      <Image
        source={{uri: image.thumbnail}}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        style={[a.w_full, a.h_full]}
      />
    </Link>
  )
}

/**
 * Photos side by side at a shared height with no space between them, the
 * next one peeking in. Swipe on native; web also gets a "next" button.
 */
function PhotoCarousel({
  images,
  linkProps,
}: {
  images: GalleryImage[]
  linkProps: PhotoLinkProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtPhone, gtMobile} = useBreakpoints()
  const galleryRef = useRef<Gallery.GalleryRef>(null)
  const [width, setWidth] = useState(0)
  const getLabel = usePhotoLabel(images.length)

  const height = gtMobile ? 360 : gtPhone ? 300 : 240
  const photoWidths = getPhotoWidths(images, height, width)
  const lastIndex = images.length - 1

  return (
    <View
      style={[{height}, t.atoms.bg_contrast_25]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Gallery.Root
          ref={galleryRef}
          label={l({
            message: plural(images.length, {
              one: '# photo',
              other: '# photos',
            }),
            comment:
              'Accessibility label for a scrollable row of photos. The number is how many photos are in it.',
          })}
          footer={
            <CarouselOverlay
              onNext={index => galleryRef.current?.scrollToIndex(index)}
            />
          }>
          {images.map((image, index) => (
            <Gallery.Item key={`${index}:${image.fullsize}`}>
              {({focusRef, tabIndex, onFocus}) => (
                <Link
                  {...linkProps}
                  label={getLabel(image, index)}
                  ref={focusRef}
                  tabIndex={tabIndex}
                  onFocus={() => {
                    onFocus()
                    linkProps.onFocus()
                  }}
                  style={{
                    width: photoWidths[index],
                    height,
                    /*
                     * The gallery always puts ITEM_GAP between items. Pulling
                     * each item's edge in by that much closes the gap while
                     * keeping the gallery's offset math right, since every
                     * item still advances by its photo's width. The last one
                     * keeps its full width so the end stays scrollable.
                     */
                    marginRight: index < lastIndex ? -Gallery.ITEM_GAP : 0,
                  }}>
                  <Image
                    source={{uri: image.thumbnail}}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                    style={[a.w_full, a.h_full]}
                  />
                </Link>
              )}
            </Gallery.Item>
          ))}
        </Gallery.Root>
      )}
    </View>
  )
}

/**
 * Each photo's width at `height`: its own aspect ratio, kept narrow enough
 * that the next photo peeks in. Photos too few or narrow to fill the card
 * stretch to fill it instead of leaving a gap.
 */
function getPhotoWidths(
  images: GalleryImage[],
  height: number,
  cardWidth: number,
) {
  const widths = images.map(image =>
    Math.min(
      height *
        Math.max(
          getAspectRatio(image.aspectRatio) ?? 1,
          MIN_CAROUSEL_ASPECT_RATIO,
        ),
      cardWidth * MAX_CAROUSEL_WIDTH,
    ),
  )
  const total = widths.reduce((sum, width) => sum + width, 0)
  const scale = total > 0 && total < cardWidth ? cardWidth / total : 1
  return widths.map(width => width * scale)
}

/** The "2/5" counter, and on web the "next" button, over the carousel. */
function CarouselOverlay({onNext}: {onNext: (index: number) => void}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {itemKeys, activeIndex, endIndex} = Gallery.useGalleryContext()
  const position = activeIndex + 1
  const total = itemKeys.length

  return (
    <>
      <View
        accessible={false}
        pointerEvents="none"
        style={[
          a.absolute,
          a.px_sm,
          a.py_2xs,
          a.rounded_full,
          {top: 8, right: 8, backgroundColor: OVERLAY_COLOR},
        ]}>
        <Text
          style={[
            a.text_xs,
            a.font_semi_bold,
            {color: 'white', fontVariant: ['tabular-nums']},
          ]}>
          {l({
            message: `${position}/${total}`,
            comment:
              'Position counter over a row of photos, e.g. “2/5”. {position} is the 1-based number of the first photo in view and {total} is how many photos there are.',
          })}
        </Text>
      </View>
      {IS_WEB && activeIndex < endIndex && (
        <View
          pointerEvents="box-none"
          style={[
            a.absolute,
            a.inset_0,
            a.justify_center,
            a.align_end,
            a.pr_sm,
          ]}>
          <Button
            label={l`Next photo`}
            size="small"
            shape="round"
            color="secondary"
            style={[t.atoms.bg, t.atoms.shadow_md]}
            onPress={() => onNext(activeIndex + 1)}>
            <ButtonIcon icon={ChevronRightIcon} />
          </Button>
        </View>
      )}
    </>
  )
}

/** The heart and favorite count, which favorite or unfavorite the gallery. */
function FavoriteButton({view}: {view: app.bsky.embed.external.ViewGallery}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const {
    canLike: canFavorite,
    isLiked: isFavorited,
    likeCount,
    toggle: toggleFavorite,
    firstActionWelcomeDialogControl,
  } = useAtmosphereLike(view, 'favorite', 'card')

  const count = formatCount(i18n, likeCount)
  const countLabel = l({
    message: plural(likeCount, {
      one: `${count} favorite`,
      other: `${count} favorites`,
    }),
    comment:
      'Number of people who favorited (liked) a photo gallery, read out by screen readers. {count} is already formatted.',
  })
  const Icon = isFavorited ? HeartFilledIcon : HeartIcon
  const color = isFavorited
    ? t.palette.pink
    : t.atoms.text_contrast_medium.color
  const content = (
    <>
      <Icon size="sm" fill={color} />
      {likeCount > 0 && (
        <Text
          style={[
            a.text_sm,
            a.font_medium,
            {color, fontVariant: ['tabular-nums']},
          ]}>
          {count}
        </Text>
      )}
    </>
  )
  const style = [a.flex_row, a.align_center, a.gap_xs]

  if (!canFavorite) {
    if (likeCount === 0 && !isFavorited) return null
    return (
      <View
        accessible
        accessibilityLabel={countLabel}
        accessibilityHint=""
        style={style}>
        {content}
      </View>
    )
  }

  const action = isFavorited
    ? l({
        message: 'Remove your favorite',
        comment:
          'Accessibility label for a button that unfavorites (unlikes) a photo gallery',
      })
    : l({
        message: 'Favorite',
        comment: 'Button that favorites (likes) a photo gallery',
      })

  return (
    <>
      <Button
        testID="activityGalleryCardFavorite"
        label={l({
          message: `${action}, ${countLabel}`,
          comment:
            'Accessibility label for a gallery’s favorite button, e.g. “Favorite, 3 favorites”. Both parts are already translated.',
        })}
        hitSlop={8}
        style={style}
        onPress={toggleFavorite}>
        {content}
      </Button>
      <AtmosphereFirstActionWelcomeDialog
        control={firstActionWelcomeDialogControl}
      />
    </>
  )
}

/** Avatars of people the viewer follows who favorited the gallery. */
function KnownFavoriters({
  view,
  interacted,
}: {
  view: app.bsky.embed.external.ViewGallery
  /** Whether the card is hovered or focused, to match its background. */
  interacted: boolean
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()

  if (!moderationOpts) return null
  const profiles = (view.viewer?.knownLikers ?? []).filter(
    profile =>
      profile.did !== currentAccount?.did &&
      !isActorHidden(profile, moderationOpts),
  )
  if (profiles.length === 0) return null

  return (
    <View accessible={false} pointerEvents="none">
      <AvatarStack
        profiles={profiles.slice(0, 3)}
        size={20}
        overlap={6}
        backgroundColor={
          interacted
            ? t.atoms.bg_contrast_25.backgroundColor
            : t.atoms.bg.backgroundColor
        }
      />
    </View>
  )
}

/**
 * "Nov 21", with the year when it isn't this year. Joined with " · " so more
 * details, like a location, can follow once the view has them.
 */
function MetaLine({view}: {view: app.bsky.embed.external.ViewGallery}) {
  const {i18n} = useLingui()
  const t = useTheme()

  const createdAt = view.createdAt ? new Date(view.createdAt) : undefined
  const parts: string[] = []
  if (createdAt && !Number.isNaN(createdAt.getTime())) {
    parts.push(
      i18n.date(createdAt, {
        month: 'short',
        day: 'numeric',
        year:
          createdAt.getFullYear() === new Date().getFullYear()
            ? undefined
            : 'numeric',
      }),
    )
  }
  if (parts.length === 0) return null

  return (
    <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
      {parts.join(' · ')}
    </Text>
  )
}
