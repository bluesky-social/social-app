import {type AtUri, isValidDid} from '@atproto/syntax'

import {app, com, type tools} from '#/lexicons'
import * as bsky from '#/types/bsky'

export function canShowBskyRecordSnapshot(
  uri: AtUri,
  report: Pick<tools.ozone.inbox.getReport.ReportView, 'subject' | 'record'>,
) {
  return (
    isValidDid(uri.host) &&
    bsky.matches(com.atproto.repo.strongRef, report.subject) &&
    !!getBskyRecordSnapshot(uri.collection, report.record)
  )
}

/** Text fields from supported record types returned by the moderation service. */
export function getBskyRecordSnapshot(collection: string, record: unknown) {
  if (
    collection === app.bsky.feed.post.$type &&
    bsky.matches(app.bsky.feed.post, record) &&
    record.text
  ) {
    return {
      kind: 'post' as const,
      text: record.text,
      facets: record.facets,
      tags: record.tags,
      langs: record.langs,
      createdAt: record.createdAt,
      labels: selfLabels(record.labels),
    }
  }
  if (
    collection === app.bsky.feed.generator.$type &&
    bsky.matches(app.bsky.feed.generator, record)
  ) {
    return {
      kind: 'feed' as const,
      name: record.displayName,
      description: record.description,
      createdAt: record.createdAt,
      labels: selfLabels(record.labels),
    }
  }
  if (
    collection === app.bsky.graph.list.$type &&
    bsky.matches(app.bsky.graph.list, record)
  ) {
    return {
      kind: 'list' as const,
      name: record.name,
      description: record.description,
      createdAt: record.createdAt,
      labels: selfLabels(record.labels),
    }
  }
  if (
    collection === app.bsky.graph.starterpack.$type &&
    bsky.matches(app.bsky.graph.starterpack, record)
  ) {
    return {
      kind: 'starterPack' as const,
      name: record.name,
      description: record.description,
      createdAt: record.createdAt,
      labels: undefined,
    }
  }
  if (
    collection === app.bsky.actor.status.$type &&
    bsky.matches(app.bsky.actor.status, record) &&
    record.status === app.bsky.actor.status.live.value
  ) {
    return {
      kind: 'liveStatus' as const,
      createdAt: record.createdAt,
      labels: undefined,
    }
  }
}

function selfLabels(labels: unknown) {
  return bsky.matches(com.atproto.label.defs.selfLabels, labels)
    ? labels.values
    : undefined
}
