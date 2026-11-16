import {View} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {parseAtUriString} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {useRequireAuth, useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {type ItemFocusProps} from '#/components/Gallery'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon} from '#/components/icons/ArrowOutOfBox'
import {Mark as BlueskyIcon} from '#/components/icons/brands/Mark'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlaneIcon} from '#/components/icons/PaperPlane'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Square'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import {
  getAssociatedReportSubjects,
  useGetCopyForSubject,
  useGlobalReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Toast from '#/components/Toast'
import {useAgeAssurance} from '#/ageAssurance'
import {IS_WEB} from '#/env'
import {type app, place, site, social} from '#/lexicons'
import {useDevMode} from '#/storage/hooks/dev-mode'

const BUTTON_VISUAL_ADJUSTMENT = 4

/**
 * The records behind a card whose AT URIs dev mode can copy. An article's
 * view also lists its publication; a gallery's lists its photos, which we skip.
 */
const DEV_RECORD_TYPES = {
  article: [site.standard.document.$type, site.standard.publication.$type],
  photo: [social.grain.gallery.$type],
  publication: [site.standard.publication.$type],
  livestream: [place.stream.livestream.$type],
} as const

/**
 * Top-right options menu for Atmosphere cards. Render it as a sibling
 * of the card's primary link, never inside it, so the two stay un-nested.
 * Sharing actions always use the card's external URL (`item.uri`).
 * `children` are extra `Menu.Item`s shown before Report.
 */
export function AtmosphereCardMenu({
  type,
  item,
  reportableTypes,
  author,
  galleryFocus,
  offsetY = 0,
  offsetX = 0,
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
  galleryFocus?: ItemFocusProps
  /**
   * Distance from the card's top edge.
   */
  offsetY?: number
  /**
   * Distance from the card's right edge.
   */
  offsetX?: number
  /**
   * Extra `Menu.Item`s shown after the view/profile actions and before Report.
   * Pass `Menu.Item`s directly; native menu groups drop any other children.
   */
  children?: React.ReactNode
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const openLink = useOpenLink()
  const {hasSession} = useSession()
  const aa = useAgeAssurance()
  const requireAuth = useRequireAuth()
  const {openComposer} = useOpenComposer()
  const sendViaChatControl = useDialogControl()
  const reportDialogControl = useGlobalReportDialogControl()
  const getReportCopy = useGetCopyForSubject()
  const [devModeEnabled] = useDevMode()
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

  const getCopyUriLabel = (collection: string) => {
    switch (collection) {
      case site.standard.document.$type:
        return l`Copy article AT URI`
      case site.standard.publication.$type:
        return l`Copy publication AT URI`
      case social.grain.gallery.$type:
        return l`Copy gallery AT URI`
      default:
        return l`Copy livestream AT URI`
    }
  }

  const canSendViaChat = hasSession && aa.state.access === aa.Access.Full
  const shareLabel = IS_WEB ? l`Copy link` : l`Share`

  const reportTargets = getAssociatedReportSubjects(item.associatedRefs).filter(
    ({parsedSubject}) =>
      'nsid' in parsedSubject && reportableTypes.includes(parsedSubject.nsid),
  )

  const devRecords = devModeEnabled
    ? (item.associatedRefs ?? []).flatMap(({uri}) => {
        const parsed = parseAtUriString(uri)
        const recordTypes: readonly string[] = DEV_RECORD_TYPES[type]
        const collection = parsed.success ? parsed.value.collection : undefined
        return collection && recordTypes.includes(collection)
          ? [{uri, collection}]
          : []
      })
    : []

  return (
    <View
      style={[
        a.absolute,
        a.z_10,
        {
          top: offsetY > 0 ? offsetY - BUTTON_VISUAL_ADJUSTMENT : 0,
          right: offsetX > 0 ? offsetX - BUTTON_VISUAL_ADJUSTMENT : 0,
        },
      ]}>
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
            <Menu.Item
              testID="atmosphereCardShare"
              label={shareLabel}
              onPress={() => void shareUrl(item.uri)}>
              <Menu.ItemText>{shareLabel}</Menu.ItemText>
              <Menu.ItemIcon
                icon={IS_WEB ? ChainLinkIcon : ArrowOutOfBoxIcon}
                position="right"
              />
            </Menu.Item>
            <Menu.Item
              testID="atmosphereCardCreatePost"
              label={l`Create post`}
              onPress={() =>
                requireAuth(() =>
                  openComposer({text: item.uri, logContext: 'Other'}),
                )
              }>
              <Menu.ItemText>{l`Post to Bluesky`}</Menu.ItemText>
              <Menu.ItemIcon icon={BlueskyIcon} position="right" />
            </Menu.Item>
            {canSendViaChat && (
              <Menu.Item
                testID="atmosphereCardSendViaChat"
                label={l`Send via chat`}
                onPress={() => sendViaChatControl.open()}>
                <Menu.ItemText>{l`Send via chat`}</Menu.ItemText>
                <Menu.ItemIcon icon={PaperPlaneIcon} position="right" />
              </Menu.Item>
            )}
          </Menu.Group>
          <Menu.Divider />
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
              reportTargets.map(({subject, parsedSubject}) => {
                /*
                 * Titled like the report dialog it opens, so the menu and
                 * dialog always agree. Rendered inline because the native
                 * Menu.Group only renders direct Menu.Item children.
                 */
                const {title} = getReportCopy(parsedSubject)
                return (
                  <Menu.Item
                    key={subject.uri}
                    label={title}
                    onPress={() => reportDialogControl.open({subject})}>
                    <Menu.ItemText>{title}</Menu.ItemText>
                    <Menu.ItemIcon icon={WarningIcon} position="right" />
                  </Menu.Item>
                )
              })
            ) : (
              <Menu.Item label={labels.report} disabled onPress={() => {}}>
                <Menu.ItemText>{labels.report}</Menu.ItemText>
                <Menu.ItemIcon icon={WarningIcon} position="right" />
              </Menu.Item>
            )}
          </Menu.Group>
          {devRecords.length > 0 && (
            <>
              <Menu.Divider />
              <Menu.Group>
                {devRecords.map(({uri, collection}) => {
                  const copyLabel = getCopyUriLabel(collection)
                  return (
                    <Menu.Item
                      key={uri}
                      testID="atmosphereCardCopyUri"
                      label={copyLabel}
                      onPress={() => {
                        void Clipboard.setStringAsync(uri)
                        Toast.show(l`Copied to clipboard`, {type: 'success'})
                      }}>
                      <Menu.ItemText>{copyLabel}</Menu.ItemText>
                      <Menu.ItemIcon icon={ClipboardIcon} position="right" />
                    </Menu.Item>
                  )
                })}
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
        {/* Outside Menu.Outer so it stays mounted after the menu closes. */}
        <SendViaChatDialog
          control={sendViaChatControl}
          onSelectChat={conversation =>
            navigation.navigate('MessagesConversation', {
              conversation,
              text: item.uri,
            })
          }
        />
      </Menu.Root>
    </View>
  )
}
