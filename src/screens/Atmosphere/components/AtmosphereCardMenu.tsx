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
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {
  useAtmosphereContentContext,
  useAtmosphereMetricContext,
} from '#/screens/Atmosphere/metrics/context'
import {atoms as a} from '#/alf'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import {AppThemeProvider} from '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {type ItemFocusProps} from '#/components/Gallery'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon} from '#/components/icons/ArrowOutOfBox'
import {Mark as BlueskyIcon} from '#/components/icons/brands/Mark'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
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
import {useAnalytics} from '#/analytics'
import {type Metrics} from '#/analytics/metrics'
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
  inline = false,
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
   * Renders in the parent's layout, e.g. a card's footer row, instead of
   * pinned to the card's top-right corner. The offsets are then ignored.
   */
  inline?: boolean
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
  const openLink = useOpenLink({preferNativeApp: type === 'photo'})
  const {hasSession} = useSession()
  const aa = useAgeAssurance()
  const requireAuth = useRequireAuth()
  const {openComposer} = useOpenComposer()
  const sendViaChatControl = useDialogControl()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const content = useAtmosphereContentContext()
  const sendFeedback = useAtmosphereFeedback()
  const logAction = (
    action: Metrics['atmosphere:menu:action']['action'],
    reportCollection?: string,
  ) => {
    if (!content) return
    ax.metric('atmosphere:menu:action', {...content, action, reportCollection})
  }
  const menuControl = Menu.useMenuControl()
  /** Logs every way the menu opens: press, keyboard (web), and so on. */
  const loggedMenuControl: Menu.MenuControlProps = {
    ...menuControl,
    open: (...args) => {
      if (content) ax.metric('atmosphere:menu:opened', content)
      menuControl.open(...args)
    },
  }
  const reportDialogControl = useGlobalReportDialogControl()
  const getReportCopy = useGetCopyForSubject()
  const [devModeEnabled] = useDevMode()
  let labels: {trigger: string; view: string; report: string}
  switch (type) {
    case 'article': {
      const provider = getAtmosphereProvider(item.providerId)
      labels = {
        trigger: l`Article options`,
        view: provider
          ? l({
              message: `Read on ${provider.name}`,
              comment:
                'Menu item that opens an article on the platform it was published with, e.g. “Read on Leaflet”',
            })
          : l`View article`,
        report: l`Report article`,
      }
      break
    }
    case 'photo': {
      const provider = getAtmosphereProvider(item.providerId)
      labels = {
        trigger: l`Photo options`,
        view: provider
          ? l({
              message: `View on ${provider.name}`,
              comment:
                'Menu item that opens a photo gallery in the app it was posted with, e.g. “View on Grain”',
            })
          : l`View photo`,
        report: l`Report photo`,
      }
      break
    }
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
      style={
        inline
          ? undefined
          : [
              a.absolute,
              a.z_10,
              {
                top: offsetY > 0 ? offsetY - BUTTON_VISUAL_ADJUSTMENT : 0,
                right: offsetX > 0 ? offsetX - BUTTON_VISUAL_ADJUSTMENT : 0,
              },
            ]
      }>
      <Menu.Root control={loggedMenuControl}>
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
              // Just the ellipsis, without the round button's fill
              style={[a.bg_transparent]}
              tabIndex={galleryFocus?.tabIndex}
              onFocus={() => {
                props.onFocus()
                galleryFocus?.onFocus()
              }}>
              <ButtonIcon icon={EllipsisIcon} size="sm" />
            </Button>
          )}
        </Menu.Trigger>
        {/* The card may wear a publication's theme; its menu shouldn't. */}
        <AppThemeProvider>
          <Menu.Outer>
            <Menu.Group>
              <Menu.Item
                testID="atmosphereCardShare"
                label={shareLabel}
                onPress={() => {
                  logAction(IS_WEB ? 'copyLink' : 'share')
                  sendFeedback?.('app.bsky.feed.defs#interactionShare')
                  void shareUrl(item.uri)
                }}>
                <Menu.ItemText>{shareLabel}</Menu.ItemText>
                <Menu.ItemIcon
                  icon={IS_WEB ? ChainLinkIcon : ArrowOutOfBoxIcon}
                  position="right"
                />
              </Menu.Item>
              <Menu.Item
                testID="atmosphereCardCreatePost"
                label={l`Create post`}
                onPress={() => {
                  logAction('createPost')
                  requireAuth(() =>
                    openComposer({text: item.uri, logContext: 'Other'}),
                  )
                }}>
                <Menu.ItemText>{l`Post to Bluesky`}</Menu.ItemText>
                <Menu.ItemIcon icon={BlueskyIcon} position="right" />
              </Menu.Item>
              {canSendViaChat && (
                <Menu.Item
                  testID="atmosphereCardSendViaChat"
                  label={l`Send via chat`}
                  onPress={() => {
                    logAction('sendViaChat')
                    sendViaChatControl.open()
                  }}>
                  <Menu.ItemText>{l`Send via chat`}</Menu.ItemText>
                  <Menu.ItemIcon icon={PaperPlaneIcon} position="right" />
                </Menu.Item>
              )}
            </Menu.Group>
            <Menu.Divider />
            {sendFeedback && hasSession && (
              <>
                <Menu.Group>
                  <Menu.Item
                    testID="atmosphereCardShowMore"
                    label={l`Show more like this`}
                    onPress={() => {
                      sendFeedback('app.bsky.feed.defs#requestMore')
                      Toast.show(
                        l({
                          message: 'Feedback sent to feed operator',
                          context: 'toast',
                        }),
                      )
                    }}>
                    <Menu.ItemText>{l`Show more like this`}</Menu.ItemText>
                    <Menu.ItemIcon icon={EmojiSmile} position="right" />
                  </Menu.Item>
                  <Menu.Item
                    testID="atmosphereCardShowLess"
                    label={l`Show less like this`}
                    onPress={() => {
                      sendFeedback('app.bsky.feed.defs#requestLess')
                      Toast.show(
                        l({
                          message: 'Feedback sent to feed operator',
                          context: 'toast',
                        }),
                      )
                    }}>
                    <Menu.ItemText>{l`Show less like this`}</Menu.ItemText>
                    <Menu.ItemIcon icon={EmojiSad} position="right" />
                  </Menu.Item>
                </Menu.Group>
                <Menu.Divider />
              </>
            )}
            <Menu.Group>
              <Menu.Item
                label={labels.view}
                onPress={() => {
                  logAction('viewExternal')
                  sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
                  openLink(item.uri)
                }}>
                <Menu.ItemText>{labels.view}</Menu.ItemText>
                <Menu.ItemIcon icon={ExternalLinkIcon} position="right" />
              </Menu.Item>
              {author && (
                <Menu.Item
                  label={l`View author profile`}
                  onPress={() => {
                    logAction('viewProfile')
                    sendFeedback?.('app.bsky.feed.defs#clickthroughAuthor')
                    if (metricContext) {
                      ax.metric('atmosphere:profile:press', {
                        ...metricContext,
                        profileDid: author.did,
                        source: 'cardMenu',
                      })
                    }
                    navigation.navigate('Profile', {name: author.did})
                  }}>
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
                      onPress={() => {
                        logAction(
                          'report',
                          'nsid' in parsedSubject
                            ? parsedSubject.nsid
                            : undefined,
                        )
                        reportDialogControl.open({
                          subject,
                          ...(sendFeedback
                            ? {
                                onAfterSubmit: ({
                                  reason,
                                }: {
                                  reason: string | undefined
                                }) =>
                                  sendFeedback(
                                    'app.bsky.feed.defs#interactionUnspecced',
                                    {
                                      type: 'report',
                                      reason,
                                    },
                                  ),
                              }
                            : {}),
                        })
                      }}>
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
            onSelectChat={conversation => {
              sendFeedback?.('app.bsky.feed.defs#interactionShare')
              navigation.navigate('MessagesConversation', {
                conversation,
                text: item.uri,
              })
            }}
          />
        </AppThemeProvider>
      </Menu.Root>
    </View>
  )
}
