import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type $Typed} from '@atproto/lex'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Square'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import {
  getAssociatedReportSubjects,
  useCopyForSubject,
  useGlobalReportDialogControl,
} from '#/components/moderation/ReportDialog'
import {type ParsedReportSubject} from '#/components/moderation/ReportDialog/types'
import {type app, type com} from '#/lexicons'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

/**
 * Top-right options menu for Atmosphere cards. Render it as a sibling
 * of the card's primary link, never inside it, so the two stay un-nested.
 * `children` are extra `Menu.Item`s shown before Report.
 */
export function AtmosphereCardMenu({
  type,
  item,
  reportableTypes,
  author,
  galleryFocus,
  style,
  children,
}: (
  | {type: 'article'; item: app.bsky.embed.external.ViewArticle}
  | {type: 'photo'; item: app.bsky.embed.external.ViewGallery}
  | {type: 'publication'; item: app.bsky.embed.external.ViewArticlePublication}
  | {type: 'livestream'; item: app.bsky.embed.external.ViewLivestream}
) & {
  /**
   * Collections whose associated records may be reported from this card.
   */
  reportableTypes: readonly string[]
  /**
   * Omit when the card can't tell who owns the content; the profile action is
   * then left out.
   */
  author?: app.bsky.actor.defs.ProfileViewBasic
  galleryFocus?: ExploreGalleryFocusProps
  /**
   * Applied last to the absolute wrapper, e.g. to override the default
   * top/right inset.
   */
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const openLink = useOpenLink()
  let labels: {trigger: string; view: string; report: string}
  switch (type) {
    case 'article':
      labels = {
        trigger: l`Article options`,
        view: l`View article`,
        report: l`Report article`,
      }
      break
    case 'photo':
      labels = {
        trigger: l`Photo options`,
        view: l`View photo`,
        report: l`Report photo`,
      }
      break
    case 'publication':
      labels = {
        trigger: l`Publication options`,
        view: l`View publication`,
        report: l`Report publication`,
      }
      break
    case 'livestream':
      labels = {
        trigger: l`Livestream options`,
        view: l`View livestream`,
        report: l`Report livestream`,
      }
      break
  }

  const reportTargets = getAssociatedReportSubjects(item.associatedRefs).filter(
    ({parsedSubject}) =>
      'nsid' in parsedSubject && reportableTypes.includes(parsedSubject.nsid),
  )

  return (
    <View style={[a.absolute, a.z_10, {top: 8, right: 8}, style]}>
      <Menu.Root>
        <Menu.Trigger label={labels.trigger}>
          {({props}) => (
            <Button
              {...props}
              testID="atmosphereCardMenuTrigger"
              label={labels.trigger}
              size="tiny"
              shape="round"
              color="secondary"
              variant="ghost"
              hitSlop={8}
              tabIndex={galleryFocus?.tabIndex}
              onFocus={() => {
                props.onFocus()
                galleryFocus?.onFocus()
              }}>
              <ButtonIcon icon={EllipsisIcon} size="sm" />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item label={labels.view} onPress={() => openLink(item.uri)}>
              <Menu.ItemText>{labels.view}</Menu.ItemText>
              <Menu.ItemIcon icon={ExternalLinkIcon} position="right" />
            </Menu.Item>
            {author && (
              <Menu.Item
                label={l`View author profile`}
                onPress={() =>
                  navigation.navigate('Profile', {name: author.did})
                }>
                <Menu.ItemText>{l`View author profile`}</Menu.ItemText>
                <Menu.ItemIcon icon={PersonIcon} position="right" />
              </Menu.Item>
            )}
            {children}
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            {reportTargets.length ? (
              reportTargets.map(({subject, parsedSubject}) => (
                <ReportItem
                  key={subject.uri}
                  subject={subject}
                  parsedSubject={parsedSubject}
                />
              ))
            ) : (
              <Menu.Item label={labels.report} disabled onPress={() => {}}>
                <Menu.ItemText>{labels.report}</Menu.ItemText>
                <Menu.ItemIcon icon={WarningIcon} position="right" />
              </Menu.Item>
            )}
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
    </View>
  )
}

/**
 * Titled like the report dialog it opens, so the menu and dialog always agree.
 * A component of its own because the copy is a hook, one per record.
 */
function ReportItem({
  subject,
  parsedSubject,
}: {
  subject: $Typed<com.atproto.repo.strongRef.Main>
  parsedSubject: ParsedReportSubject
}) {
  const reportDialogControl = useGlobalReportDialogControl()
  const {title} = useCopyForSubject(parsedSubject)

  return (
    <Menu.Item
      label={title}
      onPress={() => reportDialogControl.open({subject})}>
      <Menu.ItemText>{title}</Menu.ItemText>
      <Menu.ItemIcon icon={WarningIcon} position="right" />
    </Menu.Item>
  )
}
