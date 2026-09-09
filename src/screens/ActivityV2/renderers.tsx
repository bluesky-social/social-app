import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Text} from '#/components/Typography'
import {
  ActivityRow,
  ActivityRowFooter,
  ActivityRowHeader,
} from './components/ActivityHeader'
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

export function UnknownActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{l`did something`}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function DocumentActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActivityActorGroupItem(item)
    ? l`${plural(item.group.items.length, {
        one: 'published # article',
        other: 'published # articles',
      })}`
    : isActivitySubjectGroupItem(item)
      ? l`did something with an article`
      : l`published an article`
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{actionText}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function PublicationActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActivityActorGroupItem(item)
    ? l`${plural(item.group.items.length, {
        one: 'created # publication',
        other: 'created # publications',
      })}`
    : isActivitySubjectGroupItem(item)
      ? l`did something with a publication`
      : l`created a publication`
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{actionText}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function RecommendationActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  if (isActivityActorGroupItem(item)) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader actorPresentation={actorPresentation}>
          <Text>
            {l`${plural(item.group.items.length, {
              one: 'recommended # article',
              other: 'recommended # articles',
            })}`}
          </Text>
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={timestamp} />
      </ActivityRow>
    )
  }

  const documentUri = getRecommendationDocumentUri(item)
  const author = getDocumentAuthor(item, documentUri)
  const title = getDocumentTitle(item, documentUri)
  const documentUrl = getDocumentUrl(item, documentUri)

  if (author && title) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader actorPresentation={actorPresentation}>
          <Text>{`${l`recommended`} `}</Text>
          <ActivityInlineLinkText
            label={l`View ${author.label}’s profile`}
            to={makeProfileLink({did: author.did, handle: author.handle})}>
            {author.label}
          </ActivityInlineLinkText>
          <Text>{`${l`’s article`} `}</Text>
          {documentUrl ? (
            <>
              <Text>“</Text>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open article “${title}”`}
                to={documentUrl}>
                {title}
              </ActivityInlineLinkText>
              <Text>”</Text>
            </>
          ) : (
            <Text>{`“${title}”`}</Text>
          )}
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={timestamp} />
      </ActivityRow>
    )
  }

  if (author) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader actorPresentation={actorPresentation}>
          <Text>{`${l`recommended`} `}</Text>
          <ActivityInlineLinkText
            label={l`View ${author.label}’s profile`}
            to={makeProfileLink({did: author.did, handle: author.handle})}>
            {author.label}
          </ActivityInlineLinkText>
          <Text>{l`’s article`}</Text>
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={timestamp} />
      </ActivityRow>
    )
  }

  if (title) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader actorPresentation={actorPresentation}>
          <Text>{`${l`recommended an article`} `}</Text>
          {documentUrl ? (
            <>
              <Text>“</Text>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open article “${title}”`}
                to={documentUrl}>
                {title}
              </ActivityInlineLinkText>
              <Text>”</Text>
            </>
          ) : (
            <Text>{`“${title}”`}</Text>
          )}
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={timestamp} />
      </ActivityRow>
    )
  }

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{l`recommended an article`}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function SubscriptionActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  if (isActivityActorGroupItem(item)) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader actorPresentation={actorPresentation}>
          <Text>
            {l`subscribed to ${plural(item.group.items.length, {
              one: '# publication',
              other: '# publications',
            })}`}
          </Text>
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={timestamp} />
      </ActivityRow>
    )
  }

  const publication = getSubscriptionPublication(item)
  if (publication?.name) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader actorPresentation={actorPresentation}>
          {publication.url ? (
            <>
              <Text>{`${l`subscribed to`} `}</Text>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open publication ${publication.name}`}
                to={publication.url}>
                {publication.name}
              </ActivityInlineLinkText>
            </>
          ) : (
            <Text>{l`subscribed to ${publication.name}`}</Text>
          )}
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={timestamp} />
      </ActivityRow>
    )
  }

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{l`subscribed to a publication`}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function LivestreamActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActivityActorGroupItem(item)
    ? l`${plural(item.group.items.length, {
        one: 'started # livestream',
        other: 'started # livestreams',
      })}`
    : isActivitySubjectGroupItem(item)
      ? l`did something with a livestream`
      : l`started a livestream`
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{actionText}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function GrainPhotoActivityRenderer({
  actorPresentation,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActivityActorGroupItem(item)
    ? l`${plural(item.group.items.length, {
        one: 'posted # photo',
        other: 'posted # photos',
      })}`
    : isActivitySubjectGroupItem(item)
      ? l`posted photos`
      : l`posted a photo`
  const body = undefined
  const timestamp = getActivityTimestamp(item)

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader actorPresentation={actorPresentation}>
        <Text>{actionText}</Text>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={timestamp} />
    </ActivityRow>
  )
}

function getActivityTimestamp(item: ActivityPresentationItem) {
  return item.type === 'activity'
    ? item.activity.record.indexedAt
    : item.group.indexedAt
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
  return publicationRecord.name.trim()
    ? {
        name,
        url: getWebUrl(publicationRecord.url),
      }
    : undefined
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
