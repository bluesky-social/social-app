import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {createDocumentExternalView} from '#/screens/Atmosphere/externalViews'
import {getRecordActor} from '#/screens/Atmosphere/presentation'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {
  getArticleActivityUri,
  getShareActivities,
} from '#/screens/Atmosphere/rowLayout'
import {isDocumentRecord} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
} from './ActivityPrimitives'
import {DocumentMenu} from './DocumentMenu'
import {ShareSnippets} from './ShareSnippets'

export function ShareActivityRenderer({
  item,
  computedItemView,
  testID,
}: ActivityRendererProps) {
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  if (!first || computedItemView.actors.length === 0) return null
  const actorGroup = item.type === 'group' && item.group.groupBy === 'actor'
  const documentUri = getArticleActivityUri(item)
  const shares = getShareActivities(item)
  const seenActors = new Set<string>()
  const actors = shares.flatMap(({actor}) => {
    if (seenActors.has(actor.did)) return []
    seenActors.add(actor.did)
    return [actor]
  })
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = actorGroup ? item.group.items.length - 1 : 0
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more post', other: '# more posts'})}`
      : undefined
  const view = createDocumentExternalView({uri: documentUri, ...item})
  const record = documentUri
    ? item.associatedRecords[documentUri]?.record
    : undefined
  const title =
    view?.title.trim() ||
    (isDocumentRecord(record) ? record.title.trim() : '') ||
    l`Article unavailable`
  const author = getRecordActor(documentUri, item.actors)
  const menu =
    view || author ? <DocumentMenu view={view} author={author} /> : undefined
  const isMultiple = shares.length > 1

  return (
    <View testID={testID} style={a.px_xl}>
      {shares.length > 0 ? (
        <View testID="atmosphereShareCard">
          <ActivityCard>
            <View style={a.gap_md}>
              <View style={[a.flex_row, a.align_start, a.gap_sm]}>
                <View style={a.flex_1}>
                  <ActivityActorLine
                    actors={actors}
                    action={l`shared`}
                    timestamp={timestamp}
                  />
                </View>
                {menu}
              </View>
              {!isMultiple ? (
                <ShareSnippets
                  shares={shares}
                  associatedRecords={item.associatedRecords}
                  showActorMetadata={false}
                />
              ) : null}
              <ShareDocumentPreview view={view} title={title} suffix={suffix} />
              {isMultiple ? (
                <ShareSnippets
                  shares={shares}
                  associatedRecords={item.associatedRecords}
                />
              ) : null}
            </View>
          </ActivityCard>
        </View>
      ) : (
        <ActivityFootnote
          title={l`Post unavailable`}
          icon={ShareIcon}
          suffix={suffix}>
          <ActivityActorLine
            actors={computedItemView.actors}
            action={l`shared`}
            timestamp={timestamp}
            showAvatars={false}
          />
        </ActivityFootnote>
      )}
    </View>
  )
}

/** The shared document appears once; post and profile links remain outside it. */
function ShareDocumentPreview({
  view,
  title,
  suffix,
}: {
  view: ReturnType<typeof createDocumentExternalView>
  title: string
  suffix?: string
}) {
  const t = useTheme()
  const content = (
    <>
      <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
        <Text
          emoji
          numberOfLines={3}
          style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
          {title}
        </Text>
        {suffix ? (
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {suffix}
          </Text>
        ) : null}
        {view ? (
          <Text
            emoji
            numberOfLines={1}
            style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {view.source?.title || toNiceDomain(view.uri)}
          </Text>
        ) : null}
      </View>
      {view?.thumb ? (
        <Image
          testID="atmosphereShareDocumentThumbnail"
          source={{uri: view.thumb}}
          style={[a.rounded_sm, {width: 66, height: 66}]}
          contentFit="cover"
          accessible={false}
          accessibilityIgnoresInvertColors
          loading="lazy"
          useAppleWebpCodec
        />
      ) : null}
    </>
  )
  return view ? (
    <Link
      testID="atmosphereShareDocumentPreview"
      to={view.uri}
      label={title}
      style={[a.flex_row, a.align_start, a.gap_md]}>
      {content}
    </Link>
  ) : (
    <View
      testID="atmosphereShareDocumentPreview"
      style={[a.flex_row, a.gap_md]}>
      {content}
    </View>
  )
}
