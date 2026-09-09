import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {ActivityHeader} from './components/ActivityHeader'
import {ActivityInlineLinkText} from './components/ActivityInlineLinkText'
import {
  type ActivityPresentationItem,
  isActivityActorGroupItem,
  isActivitySubjectGroupItem,
  isUsableActivityActor,
  type ResolvedActivityActors,
  tryGetAuthorityDid,
} from './presentation'
import {
  activityCollections,
  isDocumentRecord,
  isKnownActivityCollection,
  isPublicationRecord,
  isRecommendRecord,
  isSubscriptionRecord,
  type KnownActivityCollection,
} from './types'

export type ActivityRendererProps = {
  item: ActivityPresentationItem
  actorPresentation: ResolvedActivityActors
  hideTopBorder: boolean
  testID: string
}

export type ActivityRenderer = React.ComponentType<ActivityRendererProps>

export const activityRenderers: Record<
  KnownActivityCollection,
  ActivityRenderer
> = {
  [activityCollections.document]: DocumentActivityRenderer,
  [activityCollections.publication]: PublicationActivityRenderer,
  [activityCollections.recommendation]: RecommendationActivityRenderer,
  [activityCollections.subscription]: SubscriptionActivityRenderer,
  [activityCollections.livestream]: LivestreamActivityRenderer,
  [activityCollections.grainPhoto]: GrainPhotoActivityRenderer,
}

const activityRowTestIDs: Record<KnownActivityCollection, string> = {
  [activityCollections.document]: 'activityV2DocumentRow',
  [activityCollections.publication]: 'activityV2PublicationRow',
  [activityCollections.recommendation]: 'activityV2RecommendationRow',
  [activityCollections.subscription]: 'activityV2SubscriptionRow',
  [activityCollections.livestream]: 'activityV2LivestreamRow',
  [activityCollections.grainPhoto]: 'activityV2GrainPhotoRow',
}

export function getActivityRendererTestID(collection: string) {
  return isKnownActivityCollection(collection)
    ? activityRowTestIDs[collection]
    : 'activityV2UnknownRow'
}

export function UnknownActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()
  return renderHeader(props, l`did something`)
}

function DocumentActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActivityActorGroupItem(props.item)) {
    return renderHeader(
      props,
      l`${plural(props.item.group.items.length, {
        one: 'published # article',
        other: 'published # articles',
      })}`,
    )
  }

  return renderHeader(
    props,
    isActivitySubjectGroupItem(props.item)
      ? l`did something with an article`
      : l`published an article`,
  )
}

function PublicationActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActivityActorGroupItem(props.item)) {
    return renderHeader(
      props,
      l`${plural(props.item.group.items.length, {
        one: 'created # publication',
        other: 'created # publications',
      })}`,
    )
  }

  return renderHeader(
    props,
    isActivitySubjectGroupItem(props.item)
      ? l`did something with a publication`
      : l`created a publication`,
  )
}

function RecommendationActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActivityActorGroupItem(props.item)) {
    return renderHeader(
      props,
      l`${plural(props.item.group.items.length, {
        one: 'recommended # article',
        other: 'recommended # articles',
      })}`,
    )
  }

  const documentUri = getRecommendationDocumentUri(props.item)
  const author = getDocumentAuthor(props.item, documentUri)
  const title = getDocumentTitle(props.item, documentUri)
  const documentUrl = getDocumentUrl(props.item, documentUri)

  if (author && title) {
    return renderHeader(
      props,
      l`recommended ${author.label}’s article “${title}”`,
      <>
        {l`recommended`}{' '}
        <ActivityInlineLinkText
          label={l`View ${author.label}’s profile`}
          to={makeProfileLink({did: author.did, handle: author.handle})}>
          {author.label}
        </ActivityInlineLinkText>
        {l`’s article`}{' '}
        {documentUrl ? (
          <>
            {'“'}
            <ActivityInlineLinkText
              disableMismatchWarning
              label={l`Open article “${title}”`}
              to={documentUrl}>
              {title}
            </ActivityInlineLinkText>
            {'”'}
          </>
        ) : (
          `“${title}”`
        )}
      </>,
    )
  }

  if (author) {
    return renderHeader(
      props,
      l`recommended ${author.label}’s article`,
      <>
        {l`recommended`}{' '}
        <ActivityInlineLinkText
          label={l`View ${author.label}’s profile`}
          to={makeProfileLink({did: author.did, handle: author.handle})}>
          {author.label}
        </ActivityInlineLinkText>
        {l`’s article`}
      </>,
    )
  }

  if (title) {
    return renderHeader(
      props,
      l`recommended an article “${title}”`,
      <>
        {l`recommended an article`}{' '}
        {documentUrl ? (
          <>
            {'“'}
            <ActivityInlineLinkText
              disableMismatchWarning
              label={l`Open article “${title}”`}
              to={documentUrl}>
              {title}
            </ActivityInlineLinkText>
            {'”'}
          </>
        ) : (
          `“${title}”`
        )}
      </>,
    )
  }

  return renderHeader(props, l`recommended an article`)
}

function SubscriptionActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActivityActorGroupItem(props.item)) {
    return renderHeader(
      props,
      l`subscribed to ${plural(props.item.group.items.length, {
        one: '# publication',
        other: '# publications',
      })}`,
    )
  }

  const publication = getSubscriptionPublication(props.item)
  if (publication?.name) {
    return renderHeader(
      props,
      l`subscribed to ${publication.name}`,
      publication.url ? (
        <>
          {l`subscribed to`}{' '}
          <ActivityInlineLinkText
            disableMismatchWarning
            label={l`Open publication ${publication.name}`}
            to={publication.url}>
            {publication.name}
          </ActivityInlineLinkText>
        </>
      ) : (
        l`subscribed to ${publication.name}`
      ),
    )
  }

  return renderHeader(props, l`subscribed to a publication`)
}

function LivestreamActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActivityActorGroupItem(props.item)) {
    return renderHeader(
      props,
      l`${plural(props.item.group.items.length, {
        one: 'started # livestream',
        other: 'started # livestreams',
      })}`,
    )
  }

  return renderHeader(
    props,
    isActivitySubjectGroupItem(props.item)
      ? l`did something with a livestream`
      : l`started a livestream`,
  )
}

function GrainPhotoActivityRenderer(props: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActivityActorGroupItem(props.item)) {
    return renderHeader(
      props,
      l`${plural(props.item.group.items.length, {
        one: 'posted # photo',
        other: 'posted # photos',
      })}`,
    )
  }

  return renderHeader(
    props,
    isActivitySubjectGroupItem(props.item)
      ? l`posted photos`
      : l`posted a photo`,
  )
}

function renderHeader(
  props: ActivityRendererProps,
  actionAccessibilityLabel: string,
  action: React.ReactNode = actionAccessibilityLabel,
) {
  return (
    <ActivityHeader
      hideTopBorder={props.hideTopBorder}
      actorPresentation={props.actorPresentation}
      action={action}
      actionAccessibilityLabel={actionAccessibilityLabel}
      testID={props.testID}
    />
  )
}

function getRecommendationDocumentUri(item: ActivityPresentationItem) {
  if (isActivitySubjectGroupItem(item)) {
    return item.group.subject
  }

  if (item.type !== 'activity') {
    return undefined
  }

  const recommendationRecord =
    item.associatedRecords[item.activity.record.uri]?.record
  return isRecommendRecord(recommendationRecord)
    ? recommendationRecord.document
    : undefined
}

function getSubscriptionPublication(item: ActivityPresentationItem) {
  const publicationUri = getSubscriptionPublicationUri(item)
  if (!publicationUri) return undefined

  const publicationRecord = item.associatedRecords[publicationUri]?.record
  if (!isPublicationRecord(publicationRecord)) return undefined

  const name = publicationRecord.name.trim() || undefined
  return {
    name,
    url: getWebUrl(publicationRecord.url),
  }
}

function getSubscriptionPublicationUri(item: ActivityPresentationItem) {
  if (isActivitySubjectGroupItem(item)) {
    return item.group.subject
  }

  if (item.type !== 'activity') {
    return undefined
  }

  const subscriptionRecord =
    item.associatedRecords[item.activity.record.uri]?.record
  return isSubscriptionRecord(subscriptionRecord)
    ? subscriptionRecord.publication
    : undefined
}

function getDocumentTitle(
  item: ActivityPresentationItem,
  documentUri: string | undefined,
) {
  if (!documentUri) return undefined

  const documentRecord = item.associatedRecords[documentUri]?.record
  if (!isDocumentRecord(documentRecord)) return undefined

  return documentRecord.title.trim() || undefined
}

function getDocumentAuthor(
  item: ActivityPresentationItem,
  documentUri: string | undefined,
) {
  const documentAuthorDid = tryGetAuthorityDid(documentUri)
  if (!documentAuthorDid) return undefined

  const documentAuthor = item.actors[documentAuthorDid]
  return isUsableActivityActor(documentAuthor)
    ? {
        did: documentAuthor.did,
        handle: documentAuthor.handle,
        label: sanitizeHandle(documentAuthor.handle, '@'),
      }
    : undefined
}

function getDocumentUrl(
  item: ActivityPresentationItem,
  documentUri: string | undefined,
) {
  if (!documentUri) return undefined

  const documentRecord = item.associatedRecords[documentUri]?.record
  if (!isDocumentRecord(documentRecord)) return undefined

  const site =
    typeof documentRecord.site === 'string' ? documentRecord.site : undefined
  if (!site) return undefined

  const publicationRecord = site.startsWith('at://')
    ? item.associatedRecords[site]?.record
    : undefined
  const baseUrl = site.startsWith('at://')
    ? getWebUrl(publicationRecord?.url)
    : getWebUrl(site)
  if (!baseUrl) return undefined

  const path =
    typeof documentRecord.path === 'string' ? documentRecord.path : ''
  try {
    return getWebUrl(new URL(path, ensureTrailingSlash(baseUrl)).href)
  } catch {
    return undefined
  }
}

function getWebUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}
