import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme, web} from '#/alf'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {ActivityCard, ActivityTimestamp} from './ActivityPrimitives'
import {DocumentMenuPlaceholder} from './DocumentMenu'

export function ArticleCard({
  view,
  timestamp,
  remainingCount = 0,
  children,
}: {
  view: app.bsky.embed.external.ViewExternal
  timestamp: string
  remainingCount?: number
  children?: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const title = view.title?.trim() || toNiceDomain(view.uri) || view.uri
  const description = view.description?.trim()
  const sourceUri = view.source?.uri
  const sourceTitle =
    view.source?.title?.trim() ||
    (sourceUri ? toNiceDomain(sourceUri) : toNiceDomain(view.uri))
  const hasFooter = Boolean(children)

  return (
    <View testID="atmosphereArticleCard">
      <ActivityCard>
        <View style={[a.flex_row, a.align_center, a.pb_xs]}>
          {sourceUri ? (
            <Link
              to={sourceUri}
              label={sourceTitle}
              style={[a.flex_1, a.justify_start, a.pr_md, web({outline: 0})]}>
              <Source view={view} title={sourceTitle} />
            </Link>
          ) : (
            <View style={a.flex_1}>
              <Source view={view} title={sourceTitle} />
            </View>
          )}
          <ActivityTimestamp timestamp={timestamp} />
          <Text
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
            {' '}
            • 
            <InlineLinkText
              to="example"
              label={l`via pckt`}
              style={[t.atoms.text_contrast_medium, a.text_xs]}>
              via pkct
            </InlineLinkText>
          </Text>
          <DocumentMenuPlaceholder />
        </View>

        <View style={[a.gap_xs, a.pb_sm, {minWidth: 0}]}>
          <Link
            to={view.uri}
            label={title}
            testID="atmosphereArticleTitle"
            style={[a.justify_start, web({outline: 0})]}>
            <Text
              emoji
              numberOfLines={3}
              style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
              {title}
            </Text>
          </Link>
          {description ? (
            <Link
              to={view.uri}
              label={description}
              style={[a.justify_start, web({outline: 0})]}>
              <Text
                emoji
                numberOfLines={3}
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {description}
              </Text>
            </Link>
          ) : undefined}
        </View>

        {view.thumb ? (
          <Link
            to={view.uri}
            label={title}
            style={[
              a.w_full,
              a.overflow_hidden,
              a.rounded_md,
              web({outline: 0}),
            ]}>
            <Image
              testID="atmosphereArticleCover"
              source={{uri: view.thumb}}
              style={[a.w_full, {aspectRatio: 16 / 9}]}
              contentFit="cover"
              accessible
              accessibilityHint=""
              accessibilityLabel={title}
              accessibilityIgnoresInvertColors
              loading="lazy"
              useAppleWebpCodec
            />
          </Link>
        ) : undefined}

        {hasFooter ? (
          <View
            style={[
              a.pt_md,
              t.atoms.border_contrast_low,
              !view.thumb && [a.border_t, a.mt_sm],
            ]}>
            {children}
          </View>
        ) : undefined}

        {remainingCount > 0 ? (
          <Text
            emoji
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
            {l`and ${plural(remainingCount, {
              one: '# more article',
              other: '# more articles',
            })}`}
          </Text>
        ) : undefined}
      </ActivityCard>
    </View>
  )
}

function Source({
  view,
  title,
}: {
  view: app.bsky.embed.external.ViewExternal
  title: string
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      {view.source?.icon ? (
        <Image
          source={{uri: view.source.icon}}
          style={[a.rounded_xs, {width: 18, height: 18}]}
          contentFit="cover"
          accessible={false}
          accessibilityIgnoresInvertColors
          loading="lazy"
          useAppleWebpCodec
        />
      ) : undefined}
      <Text
        emoji
        numberOfLines={1}
        style={[
          a.flex_1,
          a.text_sm,
          a.font_medium,
          a.leading_snug,
          t.atoms.text,
        ]}>
        {title}
      </Text>
    </View>
  )
}
