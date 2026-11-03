import {atoms as a, useTheme, utils} from '#/alf'
import {hexToRgb} from '#/alf/util/colorGeneration'
import {PublicationCard as SharedPublicationCard} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {type app} from '#/lexicons'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

function toColorRgb(
  hex?: string,
): app.bsky.embed.external.ColorRgb | undefined {
  return hex ? (hexToRgb(hex) ?? undefined) : undefined
}

export function PublicationCard({
  publication,
  width,
  galleryFocus,
}: {
  publication: app.bsky.embed.external.ViewArticlePublication
  width?: number
  galleryFocus?: ExploreGalleryFocusProps
}) {
  const t = useTheme()
  /* The shared embed still consumes the legacy external view and RGB theme. */
  const view: app.bsky.embed.external.ViewExternal = {
    uri: publication.uri,
    title: publication.title,
    description: publication.description,
    thumb: publication.image,
    createdAt: publication.createdAt,
    updatedAt: publication.updatedAt,
    labels: publication.labels,
    associatedRefs: publication.associatedRefs,
    associatedProfiles: publication.associatedProfiles,
    source: {
      uri: publication.uri,
      title: publication.title,
      description: publication.description,
      icon: publication.logo,
      theme: publication.theme && {
        backgroundRGB: toColorRgb(publication.theme.background),
        foregroundRGB: toColorRgb(publication.theme.foreground),
        accentRGB: toColorRgb(publication.theme.accent),
        accentForegroundRGB: toColorRgb(publication.theme.accentForeground),
      },
    },
  }
  const {accentRGB, accentForegroundRGB} = view.source?.theme || {}
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
      view={view}
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
