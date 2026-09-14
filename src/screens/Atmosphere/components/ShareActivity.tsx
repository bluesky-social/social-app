import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {createDocumentExternalView} from '#/screens/Atmosphere/externalViews'
import {getRecordActor} from '#/screens/Atmosphere/presentation'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {
  getArticleActivityUri,
  getShareActivities,
} from '#/screens/Atmosphere/rowLayout'
import {type ActivityActor, isDocumentRecord} from '#/screens/Atmosphere/types'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
} from './ActivityPrimitives'
import {DocumentMenuPlaceholder} from './DocumentMenu'
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
  const isMultiple = shares.length > 1

  return (
    <View testID={testID} style={a.px_xl}>
      {shares.length > 0 ? (
        <View testID="atmosphereShareCard">
          <ActivityCard>
            <View style={[a.flex_row, a.align_start, a.gap_sm]}>
              <View style={a.flex_1}>
                <ActivityActorLine
                  actors={actors}
                  action={l`shared`}
                  timestamp={timestamp}
                />
              </View>
              <DocumentMenuPlaceholder />
            </View>
            {!isMultiple ? (
              <ShareSnippets
                shares={shares}
                associatedRecords={item.associatedRecords}
                showActorMetadata={false}
              />
            ) : null}
            <View style={[a.pt_md]}>
              <ShareDocumentPreview
                view={view}
                title={title}
                suffix={suffix}
                author={author}
              />
            </View>
            {isMultiple ? (
              <ShareSnippets
                shares={shares}
                associatedRecords={item.associatedRecords}
              />
            ) : null}
          </ActivityCard>
        </View>
      ) : (
        <ActivityFootnote
          title={l`Post unavailable`}
          icon={ShareIcon}
          actors={computedItemView.actors}
          action={l`shared`}
          timestamp={timestamp}
          suffix={suffix}
        />
      )}
    </View>
  )
}

/** The shared document appears once; post and profile links remain outside it. */
function ShareDocumentPreview({
  view,
  title,
  suffix,
  author,
}: {
  view: ReturnType<typeof createDocumentExternalView>
  title: string
  suffix?: string
  author?: ActivityActor
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const sourceTitle = view
    ? view.source?.title || toNiceDomain(view.uri)
    : undefined
  const {gtPhone} = useBreakpoints()
  const content = (
    <View
      testID="atmosphereShareDocumentPreview"
      style={[a.flex_row, a.align_start, a.gap_md]}>
      <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
        {view ? (
          <InlineLinkText
            to={view.uri}
            label={title}
            style={[t.atoms.text, a.text_lg, a.font_semi_bold, a.leading_snug]}
            numberOfLines={3}>
            {title}
          </InlineLinkText>
        ) : (
          <Text
            emoji
            numberOfLines={3}
            style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
            {title}
          </Text>
        )}
        {suffix ? (
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {suffix}
          </Text>
        ) : null}
        {view ? (
          <View
            testID="atmosphereShareDocumentByline"
            style={[a.flex_row, a.align_center, a.gap_xs, {minWidth: 0}]}>
            {sourceTitle ? (
              <InlineLinkText
                to={view.source?.uri || view.uri}
                label={sourceTitle}
                style={[
                  a.flex_shrink,
                  a.justify_start,
                  a.text_xs,
                  t.atoms.text_contrast_medium,
                ]}>
                <Text
                  testID="atmosphereShareDocumentPublication"
                  emoji
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={[a.flex_1, a.text_xs, t.atoms.text_contrast_medium]}>
                  {sourceTitle}
                </Text>
              </InlineLinkText>
            ) : null}
            {author && gtPhone ? (
              <>
                <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>•</Text>
                <InlineLinkText
                  to={makeProfileLink(author)}
                  label={l`View ${sanitizeHandle(author.handle, '@')}’s profile`}
                  style={[
                    a.flex_1,
                    a.justify_start,
                    a.text_xs,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Text
                    testID="atmosphereShareDocumentAuthor"
                    emoji
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    {l`by ${sanitizeHandle(author.handle, '@')}`}
                  </Text>
                </InlineLinkText>
              </>
            ) : null}
          </View>
        ) : null}
      </View>
      {view?.thumb ? (
        <Link
          to={view.uri}
          label={title}
          style={[a.justify_start, a.overflow_hidden]}>
          <Image
            testID="atmosphereShareDocumentThumbnail"
            source={{uri: view.thumb}}
            style={[a.rounded_sm, {width: 110, aspectRatio: 16 / 9}]}
            contentFit="cover"
            accessible={false}
            accessibilityIgnoresInvertColors
            loading="lazy"
            useAppleWebpCodec
          />
        </Link>
      ) : null}
    </View>
  )
  return content
}
