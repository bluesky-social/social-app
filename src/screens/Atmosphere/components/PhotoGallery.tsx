import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {getGalleryImages} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Gallery from '#/components/Gallery'
import {ConstrainedImage} from '#/components/images/AutoSizedImage'
import {
  computeDims,
  getAspectRatio,
  getContentHeight,
} from '#/components/images/Gallery/utils'
import {Link} from '#/components/Link'
import {type app} from '#/lexicons'

/** Feeds show a single image no taller than 1:2. */
const MIN_SINGLE_ASPECT_RATIO = 1 / 2

/**
 * A simpler take on the feed's image gallery. Every image links to the
 * gallery at its source rather than opening a lightbox: a single image is shown
 * whole, and several form a carousel with the next image peeking in.
 */
export function PhotoGallery({
  photo,
}: {
  photo: app.bsky.embed.external.ViewGallery
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtPhone, gtMobile} = useBreakpoints()
  const images = getGalleryImages(photo)

  if (images.length === 0) return null

  const label = (image: (typeof images)[number], index: number) =>
    image.alt || l`Photo ${index + 1} of ${images.length}`

  if (images.length === 1) {
    const [image] = images
    const aspectRatio = getAspectRatio(image.aspectRatio) ?? 1
    return (
      <Link
        to={photo.uri}
        label={label(image, 0)}
        accessibilityHint=""
        style={[a.w_full]}>
        <ConstrainedImage
          aspectRatio={Math.max(aspectRatio, MIN_SINGLE_ASPECT_RATIO)}>
          <Image
            source={image.thumbnail}
            contentFit="cover"
            accessibilityIgnoresInvertColors
            style={[a.w_full, a.h_full]}
          />
        </ConstrainedImage>
      </Link>
    )
  }

  const height = getContentHeight({isWithinChat: false, gtPhone, gtMobile})

  return (
    <Gallery.Root
      label={l`Photos, ${images.length} photos`}
      footer={<Gallery.PageDots />}>
      {images.map((image, index) => {
        const {aspectRatio, width} = computeDims({
          height,
          aspectRatio: getAspectRatio(image.aspectRatio),
        })
        return (
          <Gallery.Item key={`${index}:${image.fullsize}`}>
            {({focusRef, tabIndex, onFocus}) => (
              <Link
                to={photo.uri}
                label={label(image, index)}
                accessibilityHint=""
                ref={focusRef}
                tabIndex={tabIndex}
                onFocus={onFocus}
                style={[
                  a.rounded_md,
                  a.overflow_hidden,
                  t.atoms.bg_contrast_25,
                ]}>
                <Image
                  source={image.thumbnail}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                  style={{width, height, aspectRatio}}
                />
              </Link>
            )}
          </Gallery.Item>
        )
      })}
    </Gallery.Root>
  )
}
