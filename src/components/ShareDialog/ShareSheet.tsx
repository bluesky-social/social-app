import {useState} from 'react'
import {AccessibilityInfo, Platform, StyleSheet, View} from 'react-native'
import Animated, {FadeIn} from 'react-native-reanimated'
import * as ExpoClipboard from 'expo-clipboard'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {useSession} from '#/state/session'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {
  type DialogControlProps,
  useDialogContext,
  useDialogControl,
} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {IS_IOS, IS_NATIVE} from '#/env'
import {SHEET_GUTTER} from './const'
import {RecentChats} from './RecentChats'
import {type ShareAction, ShareRow} from './ShareRow'
import {type ShareSubject} from './types'
import {useInstalledSharePlatforms} from './useInstalledSharePlatforms'

/**
 * Whether to open the share sheet. It's native only, and behind
 * `share_destinations:enable`. Where it's off, keep the old share action.
 */
export function useShareSheetEnabled() {
  const ax = useAnalytics()
  return IS_NATIVE && ax.features.enabled(ax.features.ShareDestinationsEnable)
}

type ShareSheetProps = {
  subject: ShareSubject
  /** Extra actions after "Copy link", e.g. a post's Save toggle. */
  actions?: ShareAction[]
  /**
   * Runs when it's shared to an app, copied or sent to the system share
   * sheet. Not run for chats.
   */
  onShare?: () => void
  /** Runs before a chat opens with `subject.chatEmbed` attached. */
  onBeforeSendToChat?: () => void
  /** Shown at the bottom, e.g. developer options. */
  children?: React.ReactNode
}

/**
 * The share sheet, for opening with `control` from a button or another menu.
 * Only render it where `useShareSheetEnabled` is true.
 */
export function ShareSheet({
  control,
  ...props
}: {control: DialogControlProps} & ShareSheetProps) {
  return (
    <Menu.Root control={control}>
      <ShareSheetOuter {...props} />
    </Menu.Root>
  )
}

/**
 * The share sheet's content, for rendering inside an existing `Menu.Root`: a
 * chat search and grid of recent chats, then the apps installed on the device
 * and actions like Copy link and the system share sheet.
 */
export function ShareSheetOuter({
  subject,
  actions = [],
  onShare = () => {},
  onBeforeSendToChat,
  children,
}: ShareSheetProps) {
  const t = useTheme()
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const sendViaChatControl = useDialogControl()
  const aa = useAgeAssurance()

  const {uri, authorDid, type: subjectType} = subject
  const showChats = hasSession && aa.state.access === aa.Access.Full
  const loggedInOnly = !!subject.loggedInOnlyNotice

  const onNativeShare = () => {
    ax.metric('share:press:nativeShare', {
      uri,
      authorDid,
      subjectType,
      entryPoint: 'ShareMenu',
      os: Platform.OS,
    })
    void shareUrl(subject.url).then(result => {
      if (!result) return
      ax.metric('share:nativeShare:result', {
        uri,
        authorDid,
        subjectType,
        entryPoint: 'ShareMenu',
        ...result,
      })
    })
    onShare()
  }

  const onCopyLink = async () => {
    ax.metric('share:press:copyLink', {uri, subjectType})
    if (IS_IOS) {
      // iOS only
      await ExpoClipboard.setUrlAsync(subject.url)
    } else {
      await ExpoClipboard.setStringAsync(subject.url)
    }
    Toast.show(l`Copied to clipboard`, {
      type: 'success',
    })
    onShare()
  }

  const openChat = (
    conversation: string,
    source: 'recentChat' | 'chatSearch',
  ) => {
    if (subject.chatEmbed) {
      onBeforeSendToChat?.()
      navigation.navigate('MessagesConversation', {
        conversation,
        embed: subject.chatEmbed,
        embedSource: source,
      })
    } else {
      navigation.navigate('MessagesConversation', {
        conversation,
        text: subject.url,
      })
    }
  }

  const onSelectRecentChat = (conversation: string, position: number) => {
    ax.metric('share:press:recentDm', {
      uri,
      authorDid,
      subjectType,
      position,
    })
    openChat(conversation, 'recentChat')
  }

  const onSelectSearchedChat = (conversation: string) => {
    ax.metric('share:press:dmSelected', {uri, authorDid, subjectType})
    openChat(conversation, 'chatSearch')
  }

  const onOpenDmSearch = () => {
    ax.metric('share:press:openDmSearch', {uri, authorDid, subjectType})
    sendViaChatControl.open()
  }

  const allActions: ShareAction[] = [
    {
      id: 'copyLink',
      label: l`Copy link`,
      icon: ChainLinkIcon,
      onPress: () => void onCopyLink(),
    },
    ...actions,
    {
      id: 'more',
      label: l({
        message: 'More',
        comment:
          'Share menu item that opens the system share sheet with every other way to share',
      }),
      accessibilityLabel: l`More ways to share`,
      icon: DotsIcon,
      onPress: onNativeShare,
    },
  ]

  return (
    <Menu.Outer>
      <View style={[a.gap_lg, a.pt_sm]}>
        {showChats && (
          <View style={[a.gap_xl]}>
            <SearchChatsButton onPress={onOpenDmSearch} />
            <RecentChats layout="grid" onSelectChat={onSelectRecentChat} />
          </View>
        )}

        {/* Pulled up so the line sits right where the chat grid cuts off */}
        <View
          style={[
            a.gap_lg,
            showChats && {
              marginTop: -tokens.space.lg,
              paddingTop: tokens.space.sm + tokens.space.lg,
            },
          ]}>
          {showChats && (
            /*
             * A filled strip rather than a hairline border, which iOS
             * doesn't draw at some fractional positions.
             */
            <View
              style={[
                a.absolute,
                t.atoms.bg_contrast_100,
                {
                  top: 0,
                  left: SHEET_GUTTER * -1,
                  right: SHEET_GUTTER * -1,
                  height: StyleSheet.hairlineWidth,
                },
              ]}
            />
          )}
          <InstalledAppsShareRow
            // Logged-out viewers can't open it, so only link options show
            showApps={!loggedInOnly}
            actions={allActions}
            subject={subject}
            onShare={onShare}
            overChats={showChats}
          />

          {subject.loggedInOnlyNotice && (
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.justify_center,
                a.gap_xs,
                a.pb_xs,
              ]}>
              <WarningIcon size="sm" fill={t.atoms.text.color} />
              <Text style={[a.text_sm, a.leading_snug, t.atoms.text]}>
                {subject.loggedInOnlyNotice}
              </Text>
            </View>
          )}

          {children}
        </View>
      </View>

      <StackedSendViaChatDialog
        control={sendViaChatControl}
        onSelectChat={onSelectSearchedChat}
      />
    </Menu.Outer>
  )
}

/**
 * A toast inside the sheet, over the bottom of the chat grid. A real toast
 * would be hidden behind the sheet.
 */
function PasteHint({
  message,
  overChats,
}: {
  message: string
  /** Sits just above the chat grid's bottom edge; otherwise over the top. */
  overChats: boolean
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      pointerEvents="none"
      style={[
        a.absolute,
        a.align_center,
        a.z_50,
        {left: 0, right: 0},
        overChats ? [{bottom: '100%'}, a.mb_sm] : {top: 0},
      ]}>
      <Toast.ToastConfigProvider id="sharePasteHint" type="success">
        <Toast.Outer>
          <Toast.Icon />
          <Toast.Text>{message}</Toast.Text>
        </Toast.Outer>
      </Toast.ToastConfigProvider>
    </Animated.View>
  )
}

/**
 * The share row with the installed apps filled in, plus its paste hint. Its
 * own component so it mounts with the sheet, which checks the installed apps
 * again and clears the hint on every open.
 */
function InstalledAppsShareRow({
  showApps,
  overChats,
  ...props
}: {
  showApps: boolean
  /** Where the paste hint sits, see `PasteHint`. */
  overChats: boolean
} & Omit<
  React.ComponentProps<typeof ShareRow>,
  'platformIds' | 'onPasteHint'
>) {
  const installed = useInstalledSharePlatforms({enabled: showApps})
  const [pasteHint, setPasteHint] = useState<string>()
  return (
    <>
      {pasteHint && <PasteHint message={pasteHint} overChats={overChats} />}
      <ShareRow
        platformIds={(showApps && installed) || []}
        onPasteHint={message => {
          setPasteHint(message)
          AccessibilityInfo.announceForAccessibility(message)
        }}
        {...props}
      />
    </>
  )
}

/**
 * Looks like a search field, but opens the full "Send via chat" sheet on top
 * of the share sheet, which does the searching.
 */
function SearchChatsButton({onPress}: {onPress: () => void}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Button
      testID="postDropdownSendViaDMBtn"
      label={l`Search chats`}
      accessibilityHint={l`Opens a list of people and chats to send it to`}
      onPress={onPress}>
      {({pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.px_md,
            pressed ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_50,
            {height: 44, borderRadius: 10},
          ]}>
          <MagnifyingGlassIcon
            size="md"
            fill={t.atoms.text_contrast_low.color}
          />
          <Text style={[a.text_md, t.atoms.text_contrast_low]}>
            <Trans>Search chats</Trans>
          </Text>
        </View>
      )}
    </Button>
  )
}

/**
 * The "Send via chat" sheet, rendered inside the share sheet so it opens
 * stacked on top of it instead of replacing it. Picking a chat closes both
 * sheets before moving on.
 */
function StackedSendViaChatDialog({
  control,
  onSelectChat,
}: {
  control: React.ComponentProps<typeof SendViaChatDialog>['control']
  onSelectChat: (conversation: string) => void
}) {
  const sheetControl = useDialogContext()

  return (
    <SendViaChatDialog
      control={control}
      onSelectChat={conversation =>
        sheetControl.close(() => onSelectChat(conversation))
      }
    />
  )
}
