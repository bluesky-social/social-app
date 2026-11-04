import {View} from 'react-native'
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
 * Top-right options menu for article and photo cards. Render it as a sibling
 * of the card's primary link, never inside it, so the two stay un-nested.
 * `children` are extra `Menu.Item`s shown before Report.
 */
export function AtmosphereCardMenu({
  type,
  item,
  author,
  galleryFocus,
  children,
}: (
  | {type: 'article'; item: app.bsky.embed.external.ViewArticle}
  | {type: 'photo'; item: app.bsky.embed.external.ViewGallery}
) & {
  author: app.bsky.actor.defs.ProfileViewBasic
  galleryFocus?: ExploreGalleryFocusProps
  children?: React.ReactNode
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const openLink = useOpenLink()
  const triggerLabel =
    type === 'article' ? l`Article options` : l`Photo options`
  const viewLabel = type === 'article' ? l`View article` : l`View photo`
  const reportLabel = type === 'article' ? l`Report article` : l`Report photo`

  const reportTargets = getAssociatedReportSubjects(item.associatedRefs)

  return (
    <View style={[a.absolute, a.z_10, {top: 8, right: 8}]}>
      <Menu.Root>
        <Menu.Trigger label={triggerLabel}>
          {({props}) => (
            <Button
              {...props}
              testID="atmosphereCardMenuTrigger"
              label={triggerLabel}
              size="small"
              shape="round"
              color="secondary"
              hitSlop={8}
              tabIndex={galleryFocus?.tabIndex}
              onFocus={() => {
                props.onFocus()
                galleryFocus?.onFocus()
              }}>
              <ButtonIcon icon={EllipsisIcon} />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item label={viewLabel} onPress={() => openLink(item.uri)}>
              <Menu.ItemText>{viewLabel}</Menu.ItemText>
              <Menu.ItemIcon icon={ExternalLinkIcon} position="right" />
            </Menu.Item>
            <Menu.Item
              label={l`View author profile`}
              onPress={() =>
                navigation.navigate('Profile', {name: author.did})
              }>
              <Menu.ItemText>{l`View author profile`}</Menu.ItemText>
              <Menu.ItemIcon icon={PersonIcon} position="right" />
            </Menu.Item>
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
              <Menu.Item label={reportLabel} disabled onPress={() => {}}>
                <Menu.ItemText>{reportLabel}</Menu.ItemText>
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
