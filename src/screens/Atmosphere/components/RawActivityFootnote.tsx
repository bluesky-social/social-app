import {useLingui} from '@lingui/react/macro'

import {
  createDocumentExternalView,
  createPublicationExternalView,
} from '#/screens/Atmosphere/externalViews'
import {type ActivityRowItem} from '#/screens/Atmosphere/model'
import {getActivityActor} from '#/screens/Atmosphere/presentation'
import {
  getActivityDocumentUri,
  getSharePostHref,
} from '#/screens/Atmosphere/relationships'
import {
  getLivestreamDurationSeconds,
  getLivestreamStatus,
  getLivestreamUrl,
} from '#/screens/Atmosphere/streams'
import {
  activityCollections,
  isDocumentRecord,
  isGrainPhotoRecord,
  isLivestreamRecord,
  isPublicationRecord,
  isSubscriptionRecord,
} from '#/screens/Atmosphere/types'
import {useTheme} from '#/alf'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {Bookmark_Filled_Corner0_Rounded as SubscribeIcon} from '#/components/icons/Bookmark'
import {type Props as IconProps} from '#/components/icons/common'
import {Heart2_Filled_Stroke2_Corner0_Rounded as RecommendIcon} from '#/components/icons/Heart2'
import {Image_Stroke2_Corner2_Rounded as PhotoIcon} from '#/components/icons/Image'
import {PageText_Stroke2_Corner0_Rounded as ArticleIcon} from '#/components/icons/PageText'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamIcon} from '#/components/icons/StreamingLive'
import {matchStandardSitePublisherByViewHints} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {ActivityFootnote} from './ActivityPrimitives'

/** Raw roots never promote to cards or render their related activity. */
export function RawActivityFootnote({item}: {item: ActivityRowItem}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const {activity, associatedRecords} = item
  const actor = getActivityActor(activity, item.actors)
  const record = associatedRecords[activity.record.uri]?.record
  let title = activity.collection
  let action = l`updated`
  let to: string | undefined
  let app: {name: string; to: string} | undefined
  let icon: React.ComponentType<IconProps> = AtomIcon
  let iconColor: string | undefined

  switch (activity.collection) {
    case activityCollections.document:
    case activityCollections.recommendation:
    case activityCollections.share: {
      const uri = getActivityDocumentUri(activity, associatedRecords)
      const document = uri ? associatedRecords[uri]?.record : undefined
      const view = createDocumentExternalView({uri, ...item})
      const publisher = view && matchStandardSitePublisherByViewHints(view)
      title =
        view?.title.trim() ||
        (isDocumentRecord(document) ? document.title.trim() : '') ||
        l`Article unavailable`
      to = view?.uri
      app = publisher ? {name: publisher.name, to: publisher.url} : undefined
      if (activity.collection === activityCollections.recommendation) {
        action = l`recommended`
        icon = RecommendIcon
        iconColor = t.palette.primary_500
      } else if (activity.collection === activityCollections.share) {
        action = l`shared`
        icon = ShareIcon
        to = actor ? getSharePostHref(activity, actor) : undefined
      } else {
        action = l`published`
        icon = ArticleIcon
      }
      break
    }
    case activityCollections.publication:
    case activityCollections.subscription: {
      const subscription =
        activity.collection === activityCollections.subscription
      const uri = subscription
        ? isSubscriptionRecord(record)
          ? record.publication
          : undefined
        : activity.record.uri
      const publication = uri ? associatedRecords[uri]?.record : undefined
      const view = createPublicationExternalView({uri, ...item})
      const publisher = view && matchStandardSitePublisherByViewHints(view)
      title =
        (isPublicationRecord(publication) ? publication.name.trim() : '') ||
        l`Publication unavailable`
      to = view?.uri
      app = publisher ? {name: publisher.name, to: publisher.url} : undefined
      action = subscription ? l`subscribed to` : l`created`
      icon = subscription ? SubscribeIcon : ArticleIcon
      iconColor = subscription ? t.palette.positive_500 : undefined
      break
    }
    case activityCollections.livestream: {
      const stream = isLivestreamRecord(record) ? record : undefined
      title = stream
        ? stream.title?.trim() || l`Livestream`
        : l`Livestream unavailable`
      to = stream && getLivestreamUrl(stream)
      const seconds = stream && getLivestreamDurationSeconds(stream)
      const duration =
        seconds === undefined
          ? undefined
          : i18n.number(seconds < 60 ? seconds : Math.floor(seconds / 60), {
              style: 'unit',
              unit: seconds < 60 ? 'second' : 'minute',
              unitDisplay: 'short',
            })
      action =
        stream && getLivestreamStatus(stream) === 'ended'
          ? duration
            ? l`streamed for ${duration}`
            : l`streamed`
          : l`started a livestream`
      icon = StreamIcon
      app = {name: 'Streamplace', to: 'https://bsky.app/profile/stream.place'}
      break
    }
    case activityCollections.grainPhoto:
      title = isGrainPhotoRecord(record)
        ? record.alt?.trim() || l`a photo`
        : l`Photo unavailable`
      action = l`posted`
      icon = PhotoIcon
      app = {name: 'Grain', to: 'https://bsky.app/profile/grain.social'}
      break
  }

  return (
    <ActivityFootnote
      title={title}
      to={to}
      icon={icon}
      iconColor={iconColor}
      actors={actor ? [actor] : []}
      action={action}
      timestamp={activity.record.indexedAt}
      app={app}
    />
  )
}
