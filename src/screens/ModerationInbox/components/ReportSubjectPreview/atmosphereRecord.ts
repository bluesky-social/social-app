import {com, place, site, social} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Text and self-labels from the inbox record, validated for its collection. */
export function getAtmosphereRecord(collection: string, record: unknown) {
  switch (collection) {
    case site.standard.document.$type:
      if (bsky.matches(site.standard.document, record)) {
        return {
          title: record.title,
          description: record.description,
          labels: getSelfLabels(record.labels),
        }
      }
      break
    case site.standard.publication.$type:
      if (bsky.matches(site.standard.publication, record)) {
        return {
          title: record.name,
          description: record.description,
          labels: getSelfLabels(record.labels),
        }
      }
      break
    case social.grain.gallery.$type:
      if (bsky.matches(social.grain.gallery, record)) {
        return {
          title: record.title,
          description: record.description,
          labels: getSelfLabels(record.labels),
        }
      }
      break
    case place.stream.livestream.$type:
      if (bsky.matches(place.stream.livestream, record)) {
        return {title: record.title, description: undefined, labels: undefined}
      }
      break
  }
}

function getSelfLabels(labels: unknown) {
  return bsky.matches(com.atproto.label.defs.selfLabels, labels)
    ? labels.values
    : undefined
}
