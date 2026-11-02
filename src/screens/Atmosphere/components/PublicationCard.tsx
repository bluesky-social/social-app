import {type AtmospherePublicationCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme, utils} from '#/alf'
import {PublicationCard as SharedPublicationCard} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

export function PublicationCard({
  publication,
  width,
  galleryFocus,
}: {
  publication: AtmospherePublicationCardData
  width?: number
  galleryFocus?: ExploreGalleryFocusProps
}) {
  const t = useTheme()
  const {accentRGB, accentForegroundRGB} = publication.view.source?.theme || {}
  let themeColors: ssTypes.ThemeColors = {
    custom: false,
    accent: t.atoms.text.color,
    accentForeground: t.atoms.text_inverted.color,
  }
  if (accentRGB && accentForegroundRGB) {
    themeColors = {
      custom: true,
      accent: utils.rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b),
      accentForeground: utils.rgbToHex(
        accentForegroundRGB.r,
        accentForegroundRGB.g,
        accentForegroundRGB.b,
      ),
    }
  }

  return (
    <SharedPublicationCard
      hideSubscribe
      view={publication.view}
      themeColors={themeColors}
      style={[a.flex_grow, width ? {width} : undefined]}
      linkProps={
        galleryFocus && {
          ref: galleryFocus.focusRef,
          tabIndex: galleryFocus.tabIndex,
          onFocus: galleryFocus.onFocus,
        }
      }
    />
  )
}
