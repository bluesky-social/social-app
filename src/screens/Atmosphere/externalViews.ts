import {
  type ActivityContent,
  type ActivityGroupItem,
} from '#/screens/Atmosphere/types'
import {hexToRgb} from '#/alf/util/colorGeneration'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type PublicationBodyThemeColors = {
  custom: true
  accent: string
  accentForeground: string
}

/** Uses only the post supplied by the endpoint, never a quoted post. */
export function getActivityPostView(
  activity: ActivityContent | ActivityGroupItem,
): app.bsky.feed.defs.PostView | undefined {
  return 'view' in activity &&
    bsky.isType(app.bsky.feed.defs.postView, activity.view)
    ? activity.view
    : undefined
}

/** Adapts hydrated content to the shared external card without rebuilding records. */
export function getArticleExternalView(
  activity: ActivityContent,
): app.bsky.embed.external.ViewExternal | undefined {
  const view = activity.view
  if (bsky.isType(app.bsky.embed.external.viewArticle, view)) {
    if (!isSafeWebUrl(view.uri)) return undefined
    return {
      $type: 'app.bsky.embed.external#viewExternal',
      uri: view.uri,
      title: view.title,
      description: view.description,
      thumb: view.image,
      labels: view.labels,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
      readingTime: view.readingTime,
      associatedRefs: view.associatedRefs,
      associatedProfiles: view.associatedProfiles,
      source:
        view.publisher && isSafeWebUrl(view.publisher.uri)
          ? toPublicationSource(view.publisher)
          : undefined,
    }
  }

  const post = getActivityPostView(activity)
  let embed = post?.embed
  if (bsky.isType(app.bsky.embed.recordWithMedia.view, embed)) {
    embed = embed.media
  }
  return bsky.isType(app.bsky.embed.external.view, embed) &&
    isSafeWebUrl(embed.external.uri) &&
    (!embed.external.source || isSafeWebUrl(embed.external.source.uri))
    ? embed.external
    : undefined
}

export function getPublicationExternalView(
  activity: ActivityContent,
): app.bsky.embed.external.ViewExternal | undefined {
  return bsky.isType(
    app.bsky.embed.external.viewArticlePublication,
    activity.view,
  ) && isSafeWebUrl(activity.view.uri)
    ? toPublicationExternalView(activity.view)
    : undefined
}

/** The shared card's legacy external-view representation, also used by Explore. */
export function toPublicationExternalView(
  publication: app.bsky.embed.external.ViewArticlePublication,
): app.bsky.embed.external.ViewExternal {
  return {
    uri: publication.uri,
    title: publication.title,
    description: publication.description,
    thumb: publication.image,
    createdAt: publication.createdAt,
    updatedAt: publication.updatedAt,
    labels: publication.labels,
    associatedRefs: publication.associatedRefs,
    associatedProfiles: publication.associatedProfiles,
    source: toPublicationSource(publication),
  }
}

function toPublicationSource(
  publication: app.bsky.embed.external.ViewArticlePublication,
): app.bsky.embed.external.ViewExternalSource {
  return {
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
  }
}

function toColorRgb(
  hex?: string,
): app.bsky.embed.external.ColorRgb | undefined {
  return (hex ? hexToRgb(hex) : null) ?? undefined
}

export function getPublicationBodyThemeColors(
  view: app.bsky.embed.external.ViewExternal,
): PublicationBodyThemeColors | undefined {
  const accent = view.source?.theme?.accentRGB
  const foreground = view.source?.theme?.accentForegroundRGB
  if (!accent || !foreground) return undefined
  return {
    custom: true,
    accent: rgbToHex(accent),
    accentForeground: rgbToHex(foreground),
  }
}

function rgbToHex({r, g, b}: app.bsky.embed.external.ColorRgb) {
  return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`
}

export function isSafeWebUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}
