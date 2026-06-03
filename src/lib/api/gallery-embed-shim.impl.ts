/**
 * Implementation backing `AppBskyEmbedGallery`. See gallery-embed-shim.ts.
 */
import {type AppBskyEmbedDefs, type BlobRef} from '@atproto/api'

export interface Main {
  $type?: 'app.bsky.embed.gallery'
  items: Image[]
}

export interface Image {
  $type?: 'app.bsky.embed.gallery#image'
  image: BlobRef
  alt: string
  aspectRatio: AppBskyEmbedDefs.AspectRatio
}

export interface View {
  $type?: 'app.bsky.embed.gallery#view'
  items: ViewImage[]
}

export interface ViewImage {
  $type?: 'app.bsky.embed.gallery#viewImage'
  thumbnail: string
  fullsize: string
  alt: string
  aspectRatio: AppBskyEmbedDefs.AspectRatio
}

export function isMain<V>(
  v: V,
): v is V & Main & {$type: 'app.bsky.embed.gallery'} {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as {$type?: string}).$type === 'app.bsky.embed.gallery'
  )
}

export function isImage<V>(
  v: V,
): v is V & Image & {$type: 'app.bsky.embed.gallery#image'} {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as {$type?: string}).$type === 'app.bsky.embed.gallery#image'
  )
}

export function isView<V>(
  v: V,
): v is V & View & {$type: 'app.bsky.embed.gallery#view'} {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as {$type?: string}).$type === 'app.bsky.embed.gallery#view'
  )
}

export function isViewImage<V>(
  v: V,
): v is V & ViewImage & {$type: 'app.bsky.embed.gallery#viewImage'} {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as {$type?: string}).$type === 'app.bsky.embed.gallery#viewImage'
  )
}
