import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {
  ActivityPublicationCardBody,
  DocumentBody,
} from './components/ActivityBodyContent'
import {
  ActivityRow,
  ActivityRowFooter,
  ActivityRowHeader,
  ActivityRowHeaderText,
} from './components/ActivityHeader'
import {ActivityInlineLinkText} from './components/ActivityInlineLinkText'
import {type ActivityGroupRowItem} from './model'
import {
  type ActivityPresentationItem,
  type ActivityPresentationProps,
} from './presentation'
import {
  type ActivityActor,
  activityCollections,
  isDocumentRecord,
  isKnownActivityCollection,
  isPublicationRecord,
  isRecommendRecord,
  isSubscriptionRecord,
  type KnownActivityCollection,
} from './types'

export type ActivityRendererProps = ActivityPresentationProps & {
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
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{l`did something`}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function DocumentActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActorGroup(item)
    ? l`${plural(getGroupCount(item), {
        one: 'published # article',
        other: 'published # articles',
      })}`
    : isSubjectGroup(item)
      ? l`did something with an article`
      : l`published an article`

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <DocumentBody item={item} computedItemView={computedItemView} />
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function PublicationActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActorGroup(item)
    ? l`${plural(getGroupCount(item), {
        one: 'created # publication',
        other: 'created # publications',
      })}`
    : isSubjectGroup(item)
      ? l`did something with a publication`
      : l`created a publication`

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityPublicationCardBody
        item={item}
        computedItemView={computedItemView}
      />
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function RecommendationActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActorGroup(item)) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>
            {l`${plural(getGroupCount(item), {
              one: 'recommended # article',
              other: 'recommended # articles',
            })}`}
          </ActivityRowHeaderText>
        </ActivityRowHeader>
        <ActivityRowFooter item={item} />
      </ActivityRow>
    )
  }

  if (item.type === 'activity') {
    const documentUri = getRecommendationDocumentUri(item)
    const documentRecord = documentUri
      ? item.associatedRecords[documentUri]?.record
      : undefined
    const title = isDocumentRecord(documentRecord)
      ? documentRecord.title.trim() || undefined
      : undefined
    const documentUrl = isDocumentRecord(documentRecord)
      ? getDocumentUrl(documentRecord, item)
      : undefined
    const author =
      documentUri && isDocumentRecord(documentRecord)
        ? getDocumentAuthor(documentUri, item)
        : undefined
    const isFollowed = isDocumentAuthorFollowed(documentUri, item)

    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          {author ? (
            <>
              <ActivityRowHeaderText>{`${l`recommended`} `}</ActivityRowHeaderText>
              <ActivityInlineLinkText
                label={l`View ${author.label}’s profile`}
                to={author.href}>
                {author.label}
              </ActivityInlineLinkText>
              <ActivityRowHeaderText>{l`’s article`}</ActivityRowHeaderText>
            </>
          ) : (
            <ActivityRowHeaderText>
              {title
                ? `${l`recommended an article`} `
                : l`recommended an article`}
            </ActivityRowHeaderText>
          )}
          {title && !isFollowed ? (
            documentUrl ? (
              <>
                <ActivityRowHeaderText> “</ActivityRowHeaderText>
                <ActivityInlineLinkText
                  disableMismatchWarning
                  label={l`Open article “${title}”`}
                  to={documentUrl}>
                  {title}
                </ActivityInlineLinkText>
                <ActivityRowHeaderText>”</ActivityRowHeaderText>
              </>
            ) : (
              <ActivityRowHeaderText>{` “${title}”`}</ActivityRowHeaderText>
            )
          ) : undefined}
        </ActivityRowHeader>
        <DocumentBody item={item} computedItemView={computedItemView} />
        <ActivityRowFooter item={item} />
      </ActivityRow>
    )
  }

  const documentUri = getRecommendationDocumentUri(item)
  const documentRecord = documentUri
    ? item.associatedRecords[documentUri]?.record
    : undefined
  const title = isDocumentRecord(documentRecord)
    ? documentRecord.title.trim() || undefined
    : undefined
  const documentUrl = isDocumentRecord(documentRecord)
    ? getDocumentUrl(documentRecord, item)
    : undefined
  const author =
    documentUri && isDocumentRecord(documentRecord)
      ? getDocumentAuthor(documentUri, item)
      : undefined
  const isFollowed = isDocumentAuthorFollowed(documentUri, item)
  const showInlineTitle =
    item.group.items.length === 1 && Boolean(title) && !isFollowed

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        {author ? (
          <>
            <ActivityRowHeaderText>{`${l`recommended`} `}</ActivityRowHeaderText>
            <ActivityInlineLinkText
              label={l`View ${author.label}’s profile`}
              to={author.href}>
              {author.label}
            </ActivityInlineLinkText>
            <ActivityRowHeaderText>{l`’s article`}</ActivityRowHeaderText>
          </>
        ) : (
          <ActivityRowHeaderText>{l`recommended an article`}</ActivityRowHeaderText>
        )}
        {showInlineTitle ? (
          documentUrl ? (
            <>
              <ActivityRowHeaderText> “</ActivityRowHeaderText>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open article “${title}”`}
                to={documentUrl}>
                {title}
              </ActivityInlineLinkText>
              <ActivityRowHeaderText>”</ActivityRowHeaderText>
            </>
          ) : (
            <ActivityRowHeaderText>{` “${title}”`}</ActivityRowHeaderText>
          )
        ) : undefined}
      </ActivityRowHeader>
      <DocumentBody item={item} computedItemView={computedItemView} />
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function SubscriptionActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()

  if (isActorGroup(item)) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>
            {l`subscribed to ${plural(getGroupCount(item), {
              one: '# publication',
              other: '# publications',
            })}`}
          </ActivityRowHeaderText>
        </ActivityRowHeader>
        <ActivityPublicationCardBody
          item={item}
          computedItemView={computedItemView}
        />
        <ActivityRowFooter item={item} />
      </ActivityRow>
    )
  }

  const publicationUri = getSubscriptionPublicationUri(item)
  const publicationRecord = publicationUri
    ? item.associatedRecords[publicationUri]?.record
    : undefined
  const publication = isPublicationRecord(publicationRecord)
    ? {
        name: publicationRecord.name.trim() || undefined,
        url: getWebUrl(publicationRecord.url),
      }
    : undefined

  if (publication?.name) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          {publication.url ? (
            <>
              <ActivityRowHeaderText>{`${l`subscribed to`} `}</ActivityRowHeaderText>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open publication ${publication.name}`}
                to={publication.url}>
                {publication.name}
              </ActivityInlineLinkText>
            </>
          ) : (
            <ActivityRowHeaderText>{l`subscribed to ${publication.name}`}</ActivityRowHeaderText>
          )}
        </ActivityRowHeader>
        <ActivityPublicationCardBody
          item={item}
          computedItemView={computedItemView}
        />
        <ActivityRowFooter item={item} />
      </ActivityRow>
    )
  }

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{l`subscribed to a publication`}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityPublicationCardBody
        item={item}
        computedItemView={computedItemView}
      />
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function LivestreamActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActorGroup(item)
    ? l`${plural(getGroupCount(item), {
        one: 'started # livestream',
        other: 'started # livestreams',
      })}`
    : isSubjectGroup(item)
      ? l`did something with a livestream`
      : l`started a livestream`

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function GrainPhotoActivityRenderer({
  computedItemView,
  hideTopBorder,
  item,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const actionText = isActorGroup(item)
    ? l`${plural(getGroupCount(item), {
        one: 'posted # photo',
        other: 'posted # photos',
      })}`
    : isSubjectGroup(item)
      ? l`posted photos`
      : l`posted a photo`

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityRowFooter item={item} />
    </ActivityRow>
  )
}

function isActorGroup(
  item: ActivityPresentationItem,
): item is ActivityGroupRowItem & {group: {groupBy: 'actor'}} {
  return item.type === 'group' && item.group.groupBy === 'actor'
}

function isSubjectGroup(
  item: ActivityPresentationItem,
): item is ActivityGroupRowItem & {group: {groupBy: 'subject'}} {
  return item.type === 'group' && item.group.groupBy === 'subject'
}

function getGroupCount(item: ActivityPresentationItem) {
  return item.type === 'group' ? item.group.items.length : 1
}

function getRecommendationDocumentUri(item: ActivityPresentationItem) {
  if (item.type === 'activity') {
    return getRecommendationTargetUri(item.activity.record.uri, item)
  }
  if (!isSubjectGroup(item)) {
    return undefined
  }

  return (
    item.group.subject ??
    getRecommendationTargetUri(item.group.items[0]?.record.uri, item)
  )
}

function getRecommendationTargetUri(
  rootUri: string | undefined,
  item: ActivityPresentationItem,
) {
  const record = rootUri ? item.associatedRecords[rootUri]?.record : undefined
  return isRecommendRecord(record) ? record.document : undefined
}

function isDocumentAuthorFollowed(
  uri: string | undefined,
  item: ActivityPresentationItem,
) {
  const did = uri ? tryGetAuthorityDid(uri) : undefined
  return Boolean(did && item.actors[did]?.viewer?.following)
}

function getSubscriptionPublicationUri(item: ActivityPresentationItem) {
  if (isSubjectGroup(item)) {
    return item.group.subject
  }
  if (item.type !== 'activity') {
    return undefined
  }

  const record = item.associatedRecords[item.activity.record.uri]?.record
  return isSubscriptionRecord(record) ? record.publication : undefined
}

function getDocumentAuthor(uri: string, item: ActivityPresentationItem) {
  const did = tryGetAuthorityDid(uri)
  const actor = did ? item.actors[did] : undefined
  if (!isUsableActivityActor(actor)) {
    return undefined
  }

  const label = sanitizeHandle(actor.handle, '@')
  return {
    label,
    href: makeProfileLink({did: actor.did, handle: actor.handle}),
  }
}

function getDocumentUrl(
  document: Record<string, unknown>,
  item: ActivityPresentationItem,
) {
  const site = typeof document.site === 'string' ? document.site : undefined
  if (!site) return undefined

  const publicationRecord = site.startsWith('at://')
    ? item.associatedRecords[site]?.record
    : undefined
  const baseUrl = site.startsWith('at://')
    ? getWebUrl(publicationRecord?.url)
    : getWebUrl(site)
  if (!baseUrl) return undefined

  const path = typeof document.path === 'string' ? document.path : ''
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

function tryGetAuthorityDid(uri: string): string | undefined {
  try {
    return new AtUri(uri).host
  } catch {
    return undefined
  }
}

function isUsableActivityActor(
  actor: ActivityActor | undefined,
): actor is ActivityActor {
  return Boolean(actor?.did && actor.handle && !isInvalidHandle(actor.handle))
}
