import {useRef, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {
  getAssociatedProfile,
  getGalleryImages,
} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {useLogContentPress} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {KnownLikers} from '#/components/atmosphere/KnownLikers'
import {LikeButton} from '#/components/atmosphere/LikeButton'
import {MetaLine} from '#/components/atmosphere/MetaLine'
import {Button, ButtonIcon} from '#/components/Button'
import * as Gallery from '#/components/Gallery'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {getAspectRatio} from '#/components/images/Gallery/utils'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {social} from '#/lexicons'
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
 * its title, description and date. The photos and title open the gallery on
 * Grain, in the app when it's installed.
 */
export function GalleryCard({
  content: {view},
}: {
  content: Extract<ActivityContent, {type: 'gallery'}>
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  const images = getGalleryImages(view)
  const author = getAssociatedProfile(view.associatedProfiles)

  // `toActivityRows` already turns galleries without these into warnings.
  if (images.length === 0 || !author) return null

  const linkProps: GalleryLinkProps = {
    to: view.uri,
    preferNativeApp: true,
    accessibilityHint: '',
    onPress: () => {
      logPress('external')
      sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
    },
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
        t.atoms.border_contrast_low,
      ]}>
      {images.length === 1 ? (
        <SinglePhoto image={images[0]} linkProps={linkProps} />
      ) : (
        <PhotoCarousel images={images} linkProps={linkProps} />
      )}
      <View style={[a.flex_row, a.align_center, a.gap_md, a.px_md, a.pt_sm]}>
        <LikeButton
          view={view}
          kind="favorite"
          testID="activityGalleryCardFavorite"
        />
        <KnownLikers view={view} />
        <View style={a.flex_1} />
        <AtmosphereCardMenu
          inline
          type="photo"
          item={view}
          reportableTypes={[social.grain.gallery.$type]}
          author={author}
        />
      </View>
      <View style={[a.px_md, a.pb_md, {paddingTop: 2, gap: 6}]}>
        {!!view.title && (
          <InlineLinkText
            {...linkProps}
            testID="activityGalleryCardTitle"
            label={l({
              message: `Open gallery: ${view.title}`,
              comment:
                'Accessibility label for a link that opens a photo gallery. {title} is the gallery title, written by its author.',
            })}
            emoji
            numberOfLines={2}
            style={[a.text_lg, a.font_bold, a.leading_snug, t.atoms.text]}>
            {view.title}
          </InlineLinkText>
        )}
        {!!view.description.trim() && (
          <Text
            emoji
            numberOfLines={3}
            style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            {view.description}
          </Text>
        )}
        <MetaLine date={view.createdAt} />
      </View>
    </View>
  )
}

/** What the card's links share: the photos and title all open the gallery. */
type GalleryLinkProps = {
  to: string
  preferNativeApp: boolean
  accessibilityHint: string
  onPress: () => void
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
  linkProps: GalleryLinkProps
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
  linkProps: GalleryLinkProps
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
                  onFocus={onFocus}
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
