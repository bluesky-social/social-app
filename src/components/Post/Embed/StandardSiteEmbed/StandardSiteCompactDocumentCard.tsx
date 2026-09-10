import {View} from 'react-native'
import {Image} from 'expo-image'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {niceDate} from '#/lib/strings/time'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {EventStopper} from '#/view/com/util/EventStopper'
import {atoms as a, useTheme, utils, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Link} from '#/components/Link'
import * as Menu from '#/components/Menu'
import {useGlobalReportDialogControl} from '#/components/moderation/ReportDialog'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {navigate} from '#/Navigation'

const IMAGE_ASPECT_RATIO = 16 / 9

/**
 * A compact document card used by grouped Activity recommendations and actor
 * document groups.
 *
 * The caller constructs the external view so this component stays independent
 * of Activity's record and sidecar traversal.
 */
export function StandardSiteCompactDocumentCard({
  view,
}: {
  view?: app.bsky.embed.external.ViewExternal
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const cardView = view?.uri && view.title?.trim() ? view : undefined
  const title = cardView?.title?.trim() || l`Post unavailable`
  const description = cardView?.description?.trim()
    ? cardView.description
    : undefined
  const sourceTitle =
    cardView?.source?.title ||
    (cardView ? toNiceDomain(cardView.uri) : undefined)
  const sourceAccent = cardView?.source?.theme?.accentRGB
  const sourceTitleStyle = sourceAccent
    ? {
        color: utils.rgbToHex(sourceAccent.r, sourceAccent.g, sourceAccent.b),
      }
    : t.atoms.text

  const content = ({interacting}: {interacting: boolean}) => (
    <View
      testID="standard-site-compact-document-card"
      accessible={!cardView}
      accessibilityLabel={title}
      accessibilityHint=""
      style={[
        a.w_full,
        a.overflow_hidden,
        a.rounded_lg,
        a.border,
        a.p_md,
        t.atoms.bg,
        interacting
          ? [t.atoms.border_contrast_high, t.atoms.bg_contrast_25]
          : t.atoms.border_contrast_low,
      ]}>
      {cardView?.source?.icon ? (
        <View style={[a.flex_row, a.align_center, a.gap_lg, a.pb_sm]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_1]}>
            <Image
              source={{uri: cardView.source.icon}}
              style={[
                a.overflow_hidden,
                a.rounded_xs,
                t.atoms.bg_contrast_50,
                {
                  width: 18,
                  height: 18,
                },
              ]}
              contentFit="cover"
              accessible={false}
              accessibilityIgnoresInvertColors
              loading="lazy"
              useAppleWebpCodec
            />
            <Text
              emoji
              numberOfLines={1}
              style={[
                a.flex_1,
                a.text_sm,
                a.font_medium,
                a.leading_snug,
                sourceTitleStyle,
              ]}>
              {sourceTitle}
            </Text>
          </View>
        </View>
      ) : undefined}

      <View style={[a.flex_row, a.gap_md, a.pb_sm]}>
        {cardView?.thumb ? (
          <View
            testID="standard-site-compact-document-thumbnail"
            style={[
              a.overflow_hidden,
              a.rounded_sm,
              t.atoms.bg_contrast_50,
              {flex: 3, aspectRatio: IMAGE_ASPECT_RATIO, maxWidth: 119},
            ]}>
            <Image
              source={{uri: cardView.thumb}}
              style={[a.w_full, a.h_full]}
              contentFit="cover"
              accessible={false}
              accessibilityIgnoresInvertColors
              loading="lazy"
              useAppleWebpCodec
            />
          </View>
        ) : undefined}
        <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
          <Text
            emoji
            numberOfLines={2}
            style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
            {title}
          </Text>
          {description ? (
            <Text
              emoji
              numberOfLines={2}
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              {description}
            </Text>
          ) : undefined}
        </View>
      </View>

      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        {cardView?.createdAt ? (
          <Text
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
            {niceDate(i18n, cardView.createdAt, 'long', 'none')}
          </Text>
        ) : undefined}
        {cardView?.readingTime ? (
          <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
            <Clock size="sm" style={t.atoms.text_contrast_medium} />
            <Text
              style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
              {l({
                message: plural(cardView.readingTime, {
                  one: '#m',
                  other: '#m',
                }),
                comment:
                  'How long it takes to read an article, in minutes. Displayed in a short form, e.g. "5m".',
              })}
            </Text>
          </View>
        ) : undefined}
      </View>
    </View>
  )

  if (!cardView) {
    return content({interacting: false})
  }

  return (
    <View style={[a.relative]}>
      <Link
        to={cardView.uri}
        label={title}
        style={[a.w_full, a.rounded_lg, web({outline: 0})]}>
        {content}
      </Link>
      {cardView ? (
        <View style={[a.absolute, a.top_0, a.right_0, a.p_sm]}>
          <DocumentMenu view={cardView} />
        </View>
      ) : undefined}
    </View>
  )
}

function DocumentMenu({view}: {view: app.bsky.embed.external.ViewExternal}) {
  const {t: l} = useLingui()
  const openLink = useOpenLink()
  const reportDialogControl = useGlobalReportDialogControl()
  const publicationUri = view.source?.uri
  const author = getDocumentAuthor(view)

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={l`More options`}>
          {({props}) => (
            <Button
              {...props}
              label={props.accessibilityLabel}
              testID="standard-site-compact-document-menu"
              size="tiny"
              variant="ghost"
              color="secondary"
              shape="round">
              <ButtonIcon icon={EllipsisIcon} size="xs" />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel style={{minWidth: 180}}>
          <Menu.Group>
            <Menu.Item
              label={l`View publication`}
              disabled={!publicationUri}
              onPress={() => {
                if (publicationUri) openLink(publicationUri)
              }}>
              <Menu.ItemText>{l`View publication`}</Menu.ItemText>
            </Menu.Item>
            <Menu.Item
              label={l`View author`}
              disabled={!author}
              onPress={() => {
                if (author) {
                  void navigate('Profile', {name: author.handle})
                }
              }}>
              <Menu.ItemText>{l`View author`}</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            <Menu.Item
              label={l`Report this`}
              disabled={!author}
              destructive
              onPress={() => {
                if (author) {
                  reportDialogControl.open({
                    subject: {
                      ...author,
                      $type: 'app.bsky.actor.defs#profileViewBasic',
                    },
                  })
                }
              }}>
              <Menu.ItemText>{l`Report this`}</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  )
}

function getDocumentAuthor(
  view: app.bsky.embed.external.ViewExternal,
): app.bsky.actor.defs.ProfileViewBasic | undefined {
  const documentRef = view.associatedRefs?.find(ref => {
    try {
      return new AtUri(ref.uri).collection === 'site.standard.document'
    } catch {
      return false
    }
  })
  if (!documentRef) return undefined

  let authorDid: string
  try {
    authorDid = new AtUri(documentRef.uri).host
  } catch {
    return undefined
  }
  return view.associatedProfiles?.find(profile => profile.did === authorDid)
}
