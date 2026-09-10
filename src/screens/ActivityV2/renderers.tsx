import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {
  ActivityArticleEmbedsBody,
  ActivityPublicationCardBody,
} from './components/ActivityBodyContent'
import {
  ActivityRow,
  ActivityRowBody,
  ActivityRowFooter,
  ActivityRowHeader,
  ActivityRowHeaderText,
} from './components/ActivityHeader'
import {ActivityInlineLinkText} from './components/ActivityInlineLinkText'
import {type ActivityPresentationProps} from './presentation'
import {
  activityCollections,
  isKnownActivityCollection,
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
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
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
  const actionText =
    computedItemView.group.kind === 'actor'
      ? l`${plural(computedItemView.group.count, {
          one: 'published # article',
          other: 'published # articles',
        })}`
      : computedItemView.group.kind === 'subject'
        ? l`did something with an article`
        : l`published an article`
  const body =
    computedItemView.body?.kind === 'article-embeds' ? (
      <ActivityRowBody>
        <ActivityArticleEmbedsBody
          item={item}
          computedItemView={computedItemView}
        />
      </ActivityRowBody>
    ) : undefined

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
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
  const actionText =
    computedItemView.group.kind === 'actor'
      ? l`${plural(computedItemView.group.count, {
          one: 'created # publication',
          other: 'created # publications',
        })}`
      : computedItemView.group.kind === 'subject'
        ? l`did something with a publication`
        : l`created a publication`
  const body =
    computedItemView.body?.kind === 'publication-card' ? (
      <ActivityRowBody>
        <ActivityPublicationCardBody
          item={item}
          computedItemView={computedItemView}
        />
      </ActivityRowBody>
    ) : undefined

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
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
  const document = computedItemView.relationships.recommendation?.document
  const author = document?.author
  const title = document?.title
  const documentUrl = document?.url

  if (computedItemView.group.kind === 'actor') {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>
            {l`${plural(computedItemView.group.count, {
              one: 'recommended # article',
              other: 'recommended # articles',
            })}`}
          </ActivityRowHeaderText>
        </ActivityRowHeader>
        <ActivityRowFooter timestamp={computedItemView.timestamp} />
      </ActivityRow>
    )
  }

  if (author && title) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>{`${l`recommended`} `}</ActivityRowHeaderText>
          <ActivityInlineLinkText
            label={l`View ${author.label}’s profile`}
            to={author.href}>
            {author.label}
          </ActivityInlineLinkText>
          <ActivityRowHeaderText>{`${l`’s article`} `}</ActivityRowHeaderText>
          {documentUrl ? (
            <>
              <ActivityRowHeaderText>“</ActivityRowHeaderText>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open article “${title}”`}
                to={documentUrl}>
                {title}
              </ActivityInlineLinkText>
              <ActivityRowHeaderText>”</ActivityRowHeaderText>
            </>
          ) : (
            <ActivityRowHeaderText>{`“${title}”`}</ActivityRowHeaderText>
          )}
        </ActivityRowHeader>
        <ActivityRowFooter timestamp={computedItemView.timestamp} />
      </ActivityRow>
    )
  }

  if (author) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>{`${l`recommended`} `}</ActivityRowHeaderText>
          <ActivityInlineLinkText
            label={l`View ${author.label}’s profile`}
            to={author.href}>
            {author.label}
          </ActivityInlineLinkText>
          <ActivityRowHeaderText>{l`’s article`}</ActivityRowHeaderText>
        </ActivityRowHeader>
        <ActivityRowFooter timestamp={computedItemView.timestamp} />
      </ActivityRow>
    )
  }

  if (title) {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>{`${l`recommended an article`} `}</ActivityRowHeaderText>
          {documentUrl ? (
            <>
              <ActivityRowHeaderText>“</ActivityRowHeaderText>
              <ActivityInlineLinkText
                disableMismatchWarning
                label={l`Open article “${title}”`}
                to={documentUrl}>
                {title}
              </ActivityInlineLinkText>
              <ActivityRowHeaderText>”</ActivityRowHeaderText>
            </>
          ) : (
            <ActivityRowHeaderText>{`“${title}”`}</ActivityRowHeaderText>
          )}
        </ActivityRowHeader>
        <ActivityRowFooter timestamp={computedItemView.timestamp} />
      </ActivityRow>
    )
  }

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{l`recommended an article`}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
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
  const publication = computedItemView.relationships.subscription?.publication
  const body =
    computedItemView.body?.kind === 'publication-card' ? (
      <ActivityRowBody>
        <ActivityPublicationCardBody
          item={item}
          computedItemView={computedItemView}
        />
      </ActivityRowBody>
    ) : undefined

  if (computedItemView.group.kind === 'actor') {
    return (
      <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
        <ActivityRowHeader item={item} computedItemView={computedItemView}>
          <ActivityRowHeaderText>
            {l`subscribed to ${plural(computedItemView.group.count, {
              one: '# publication',
              other: '# publications',
            })}`}
          </ActivityRowHeaderText>
        </ActivityRowHeader>
        {body}
        <ActivityRowFooter timestamp={computedItemView.timestamp} />
      </ActivityRow>
    )
  }

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
        {body}
        <ActivityRowFooter timestamp={computedItemView.timestamp} />
      </ActivityRow>
    )
  }

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{l`subscribed to a publication`}</ActivityRowHeaderText>
      </ActivityRowHeader>
      {body}
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
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
  const actionText =
    computedItemView.group.kind === 'actor'
      ? l`${plural(computedItemView.group.count, {
          one: 'started # livestream',
          other: 'started # livestreams',
        })}`
      : computedItemView.group.kind === 'subject'
        ? l`did something with a livestream`
        : l`started a livestream`

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
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
  const actionText =
    computedItemView.group.kind === 'actor'
      ? l`${plural(computedItemView.group.count, {
          one: 'posted # photo',
          other: 'posted # photos',
        })}`
      : computedItemView.group.kind === 'subject'
        ? l`posted photos`
        : l`posted a photo`

  return (
    <ActivityRow hideTopBorder={hideTopBorder} testID={testID}>
      <ActivityRowHeader item={item} computedItemView={computedItemView}>
        <ActivityRowHeaderText>{actionText}</ActivityRowHeaderText>
      </ActivityRowHeader>
      <ActivityRowFooter timestamp={computedItemView.timestamp} />
    </ActivityRow>
  )
}
