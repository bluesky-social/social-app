import {type JSX, useCallback, useEffect, useRef} from 'react'
import {nativeNanoSymbol} from 'react-native-nano-icons/symbols'
import {
  SafeAreaProvider,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import {Referrer} from '@bsky.app/expo-bluesky-swiss-army'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import {
  createNativeBottomTabNavigator,
  type NativeBottomTabIcon,
} from '@react-navigation/bottom-tabs/unstable'
import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  getFocusedRouteNameFromRoute,
  type NavigationAction,
  NavigationContainer,
  type NavigationHelpers,
  type ParamListBase,
  StackActions,
  type TabNavigationState,
} from '@react-navigation/native'

import {timeout} from '#/lib/async/timeout'
import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {
  type ChatNotificationPayload,
  getNotificationPayload,
  isChatNotificationPayload,
  notificationToURL,
  storePayloadForAccountSwitch,
} from '#/lib/hooks/useNotificationHandler'
import {useWebScrollRestoration} from '#/lib/hooks/useWebScrollRestoration'
import {useCallOnce} from '#/lib/once'
import {getCurrentRoute, getTabState, TabState} from '#/lib/routes/helpers'
import {getNavigationActionFromPath, LINKING} from '#/lib/routes/linking'
import {
  getCommonNavigationAction,
  getMessagesNavigationAction,
  getTabNavigationAction,
  getTabResetAction,
} from '#/lib/routes/navigation'
import {
  type SharedNavTab,
  type SidebarTab,
  TAB_TO_NAV_ITEM,
} from '#/lib/routes/tab-to-nav-item'
import {
  type BottomTabNavigatorParams,
  type CommonNavigationDestination,
  type CommonNavigatorParams,
  type FlatNavigatorParams,
  type HomeTabNavigatorParams,
  type MessagesTabNavigatorParams,
  type MyProfileTabNavigatorParams,
  type NotificationsTabNavigatorParams,
  type RootNavigatorParams,
  type SearchTabNavigatorParams,
} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'
import {emitSoftReset} from '#/state/events'
import {useHomeBadge} from '#/state/home-badge'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {
  shouldRequestEmailConfirmation,
  snoozeEmailConfirmationPrompt,
} from '#/state/shell/reminders'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {CommunityGuidelinesScreen} from '#/view/screens/CommunityGuidelines'
import {CopyrightPolicyScreen} from '#/view/screens/CopyrightPolicy'
import {DebugModScreen} from '#/view/screens/DebugMod'
import {FeedsScreen} from '#/view/screens/Feeds'
import {ListsScreen} from '#/view/screens/Lists'
import {ModerationBlockedAccounts} from '#/view/screens/ModerationBlockedAccounts'
import {ModerationModlistsScreen} from '#/view/screens/ModerationModlists'
import {ModerationMutedAccounts} from '#/view/screens/ModerationMutedAccounts'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {PostThreadScreen} from '#/view/screens/PostThread'
import {PrivacyPolicyScreen} from '#/view/screens/PrivacyPolicy'
import {ProfileScreen} from '#/view/screens/Profile'
import {StorybookScreen} from '#/view/screens/Storybook'
import {SupportScreen} from '#/view/screens/Support'
import {TermsOfServiceScreen} from '#/view/screens/TermsOfService'
import {BottomBar} from '#/view/shell/bottom-bar/BottomBar'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {DesktopLeftNav} from '#/view/shell/desktop/LeftNav'
import {getNativeTabBarVisibility} from '#/view/shell/nativeTabBarVisibility'
import {AtmosphereScreen} from '#/screens/Atmosphere'
import {BookmarksScreen} from '#/screens/Bookmarks'
import {CustomFeedScreen} from '#/screens/CustomFeed'
import {CustomFeedLikedByScreen} from '#/screens/CustomFeed/CustomFeedLikedBy'
import {SharedPreferencesTesterScreen} from '#/screens/E2E/SharedPreferencesTesterScreen'
import {FindContactsFlowScreen} from '#/screens/FindContactsFlowScreen'
import HashtagScreen from '#/screens/Hashtag'
import {LogScreen} from '#/screens/Log'
import {MessagesScreen} from '#/screens/Messages/ChatList'
import {renderMessagesSplitViewLayout} from '#/screens/Messages/components/splitView/MessagesSplitViewLayout'
import {MessagesConversationScreen} from '#/screens/Messages/Conversation'
import {MessagesConversationSettingsScreen} from '#/screens/Messages/ConversationSettings'
import {MessagesInboxScreen} from '#/screens/Messages/Inbox'
import {MessagesJoinRequestsScreen} from '#/screens/Messages/JoinRequests'
import {MessagesSettingsScreen} from '#/screens/Messages/Settings'
import {ModerationScreen} from '#/screens/Moderation'
import {Screen as ModerationVerificationSettings} from '#/screens/Moderation/VerificationSettings'
import {ModerationInboxScreen} from '#/screens/ModerationInbox'
import {ModerationInboxNoticeDetailsScreen} from '#/screens/ModerationInbox/Notice'
import {ModerationInboxReportDetailsScreen} from '#/screens/ModerationInbox/Report'
import {ModerationInboxSettingsScreen} from '#/screens/ModerationInbox/Settings'
import {Screen as ModerationInteractionSettings} from '#/screens/ModerationInteractionSettings'
import {NotificationsScreen} from '#/screens/Notifications'
import {NotificationsActivityListScreen} from '#/screens/Notifications/ActivityList'
import {PostLikedByScreen} from '#/screens/Post/PostLikedBy'
import {PostQuotesScreen} from '#/screens/Post/PostQuotes'
import {PostRepostedByScreen} from '#/screens/Post/PostRepostedBy'
import {ProfileKnownFollowersScreen} from '#/screens/Profile/KnownFollowers'
import {ProfileFollowersScreen} from '#/screens/Profile/ProfileFollowers'
import {ProfileFollowsScreen} from '#/screens/Profile/ProfileFollows'
import {ProfileLabelerLikedByScreen} from '#/screens/Profile/ProfileLabelerLikedBy'
import {ProfileSearchScreen} from '#/screens/Profile/ProfileSearch'
import {ProfileListScreen} from '#/screens/ProfileList'
import {SavedFeeds} from '#/screens/SavedFeeds'
import {SearchScreen} from '#/screens/Search'
import {AboutSettingsScreen} from '#/screens/Settings/AboutSettings'
import {AccessibilitySettingsScreen} from '#/screens/Settings/AccessibilitySettings'
import {AccountSettingsScreen} from '#/screens/Settings/AccountSettings'
import {ActivityPrivacySettingsScreen} from '#/screens/Settings/ActivityPrivacySettings'
import {AppearanceSettingsScreen} from '#/screens/Settings/AppearanceSettings'
import {AppIconSettingsScreen} from '#/screens/Settings/AppIconSettings'
import {AppPasswordsScreen} from '#/screens/Settings/AppPasswords'
import {AutomationLabelSettingsScreen} from '#/screens/Settings/AutomationLabelSettings'
import {BetaFeaturesSettingsScreen} from '#/screens/Settings/BetaFeaturesSettings'
import {ContentAndMediaSettingsScreen} from '#/screens/Settings/ContentAndMediaSettings'
import {ExternalMediaPreferencesScreen} from '#/screens/Settings/ExternalMediaPreferences'
import {FindContactsSettingsScreen} from '#/screens/Settings/FindContactsSettings'
import {FollowingFeedPreferencesScreen} from '#/screens/Settings/FollowingFeedPreferences'
import {InterestsSettingsScreen} from '#/screens/Settings/InterestsSettings'
import {LanguageSettingsScreen} from '#/screens/Settings/LanguageSettings'
import {LegacyNotificationSettingsScreen} from '#/screens/Settings/LegacyNotificationSettings'
import {NotificationSettingsScreen} from '#/screens/Settings/NotificationSettings'
import {ActivityNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/ActivityNotificationSettings'
import {PrivacyAndSecuritySettingsScreen} from '#/screens/Settings/PrivacyAndSecuritySettings'
import {SettingsScreen} from '#/screens/Settings/Settings'
import {ThreadPreferencesScreen} from '#/screens/Settings/ThreadPreferences'
import {
  StarterPackScreen,
  StarterPackScreenShort,
} from '#/screens/StarterPack/StarterPackScreen'
import {Wizard} from '#/screens/StarterPack/Wizard'
import TopicScreen from '#/screens/Topic'
import {VideoFeed} from '#/screens/VideoFeed'
import {type Theme, useBreakpoints, useTheme} from '#/alf'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {setNavigationMetadata} from '#/analytics/metadata'
import {IS_LIQUID_GLASS, IS_NATIVE, IS_WEB} from '#/env'
import {isFollowingV2HomeDotEnabled} from '#/features/followingV2/eligibility'
import {HomeScreen} from '#/features/followingV2/home'
import {InviteScannerScreen} from '#/features/inviteFriends'
import {
  setNativeTabsMounted,
  useHasNativeTabs,
  useNativeTabBarPlacement,
} from '#/features/verticalBar'
import {useProfileTabIcon} from '#/features/verticalBar/useProfileTabIcon'
import {router} from '#/routes'

const navigationRef = createNavigationContainerRef<RootNavigatorParams>()

const HomeTab = createNativeStackNavigatorWithAuth<HomeTabNavigatorParams>()
const SearchTab = createNativeStackNavigatorWithAuth<SearchTabNavigatorParams>()
const NotificationsTab =
  createNativeStackNavigatorWithAuth<NotificationsTabNavigatorParams>()
const MyProfileTab =
  createNativeStackNavigatorWithAuth<MyProfileTabNavigatorParams>()
const MessagesTab =
  createNativeStackNavigatorWithAuth<MessagesTabNavigatorParams>()
const SecondaryTab = createNativeStackNavigatorWithAuth<CommonNavigatorParams>()
const Flat = createNativeStackNavigatorWithAuth<FlatNavigatorParams>()
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>()
/*
 * Created on first use, since creating it throws on web, which doesn't
 * support native tabs.
 */
let NativeTab:
  | ReturnType<typeof createNativeBottomTabNavigator<BottomTabNavigatorParams>>
  | undefined

/**
 * These "common screens" are reused across stacks.
 */
function commonScreens(Stack: typeof Flat, unreadCountLabel?: string) {
  const title = (page: MessageDescriptor) =>
    bskyTitle(i18n._(page), unreadCountLabel)

  return (
    <>
      <Stack.Screen
        name="NotFound"
        getComponent={() => NotFoundScreen}
        options={{title: title(msg`Not Found`)}}
      />
      <Stack.Screen
        name="Atmosphere"
        getComponent={() => AtmosphereScreen}
        options={{title: title(msg`Atmosphere`)}}
      />
      <Stack.Screen
        name="Lists"
        component={ListsScreen}
        options={{title: title(msg`Lists`), requireAuth: true}}
      />
      <Stack.Screen
        name="Moderation"
        getComponent={() => ModerationScreen}
        options={{title: title(msg`Moderation`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationInbox"
        getComponent={() => ModerationInboxScreen}
        options={{title: title(msg`Moderation inbox`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationInboxSettings"
        getComponent={() => ModerationInboxSettingsScreen}
        options={{title: title(msg`Mod inbox settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationInboxReportDetails"
        getComponent={() => ModerationInboxReportDetailsScreen}
        options={{title: title(msg`Your report`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationInboxNoticeDetails"
        getComponent={() => ModerationInboxNoticeDetailsScreen}
        options={{title: title(msg`Notice`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationModlists"
        getComponent={() => ModerationModlistsScreen}
        options={{title: title(msg`Moderation Lists`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationMutedAccounts"
        getComponent={() => ModerationMutedAccounts}
        options={{title: title(msg`Muted Accounts`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationBlockedAccounts"
        getComponent={() => ModerationBlockedAccounts}
        options={{title: title(msg`Blocked Accounts`), requireAuth: true}}
      />
      <Stack.Screen
        name="ModerationInteractionSettings"
        getComponent={() => ModerationInteractionSettings}
        options={{
          title: title(msg`Post Interaction Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ModerationVerificationSettings"
        getComponent={() => ModerationVerificationSettings}
        options={{
          title: title(msg`Verification Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Settings"
        getComponent={() => SettingsScreen}
        options={{title: title(msg`Settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="LanguageSettings"
        getComponent={() => LanguageSettingsScreen}
        options={{title: title(msg`Language Settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="Profile"
        getComponent={() => ProfileScreen}
        options={({route}) => ({
          title: bskyTitle(`@${route.params.name}`, unreadCountLabel),
        })}
      />
      <Stack.Screen
        name="ProfileFollowers"
        getComponent={() => ProfileFollowersScreen}
        options={({route}) => ({
          title: title(msg`People following @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileFollows"
        getComponent={() => ProfileFollowsScreen}
        options={({route}) => ({
          title: title(msg`People followed by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileKnownFollowers"
        getComponent={() => ProfileKnownFollowersScreen}
        options={({route}) => ({
          title: title(msg`Followers of @${route.params.name} that you know`),
        })}
      />
      <Stack.Screen
        name="ProfileList"
        getComponent={() => ProfileListScreen}
        options={{title: title(msg`List`), requireAuth: true}}
      />
      <Stack.Screen
        name="ProfileSearch"
        getComponent={() => ProfileSearchScreen}
        options={({route}) => ({
          title: title(msg`Search @${route.params.name}'s posts`),
        })}
      />
      <Stack.Screen
        name="PostThread"
        getComponent={() => PostThreadScreen}
        options={({route}) => ({
          title: title(msg`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostLikedBy"
        getComponent={() => PostLikedByScreen}
        options={({route}) => ({
          title: title(msg`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostRepostedBy"
        getComponent={() => PostRepostedByScreen}
        options={({route}) => ({
          title: title(msg`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostQuotes"
        getComponent={() => PostQuotesScreen}
        options={({route}) => ({
          title: title(msg`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="CustomFeed"
        getComponent={() => CustomFeedScreen}
        options={{title: title(msg`Feed`)}}
      />
      <Stack.Screen
        name="CustomFeedLikedBy"
        getComponent={() => CustomFeedLikedByScreen}
        options={{title: title(msg`Liked by`)}}
      />
      <Stack.Screen
        name="ProfileLabelerLikedBy"
        getComponent={() => ProfileLabelerLikedByScreen}
        options={{title: title(msg`Liked by`)}}
      />
      <Stack.Screen
        name="Debug"
        getComponent={() => StorybookScreen}
        options={{title: title(msg`Storybook`), requireAuth: true}}
      />
      <Stack.Screen
        name="DebugMod"
        getComponent={() => DebugModScreen}
        options={{title: title(msg`Moderation states`), requireAuth: true}}
      />
      <Stack.Screen
        name="InviteScanner"
        getComponent={() => InviteScannerScreen}
        options={{title: title(msg`Scan QR code`), requireAuth: true}}
      />
      <Stack.Screen
        name="SharedPreferencesTester"
        getComponent={() => SharedPreferencesTesterScreen}
        options={{title: title(msg`Shared Preferences Tester`)}}
      />
      <Stack.Screen
        name="Log"
        getComponent={() => LogScreen}
        options={{title: title(msg`Log`), requireAuth: true}}
      />
      <Stack.Screen
        name="Support"
        getComponent={() => SupportScreen}
        options={{title: title(msg`Support`)}}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        getComponent={() => PrivacyPolicyScreen}
        options={{title: title(msg`Privacy Policy`)}}
      />
      <Stack.Screen
        name="TermsOfService"
        getComponent={() => TermsOfServiceScreen}
        options={{title: title(msg`Terms of Service`)}}
      />
      <Stack.Screen
        name="CommunityGuidelines"
        getComponent={() => CommunityGuidelinesScreen}
        options={{title: title(msg`Community Guidelines`)}}
      />
      <Stack.Screen
        name="CopyrightPolicy"
        getComponent={() => CopyrightPolicyScreen}
        options={{title: title(msg`Copyright Policy`)}}
      />
      <Stack.Screen
        name="AppPasswords"
        getComponent={() => AppPasswordsScreen}
        options={{title: title(msg`App Passwords`), requireAuth: true}}
      />
      <Stack.Screen
        name="SavedFeeds"
        getComponent={() => SavedFeeds}
        options={{title: title(msg`Edit My Feeds`), requireAuth: true}}
      />
      <Stack.Screen
        name="PreferencesFollowingFeed"
        getComponent={() => FollowingFeedPreferencesScreen}
        options={{
          title: title(msg`Following Feed Preferences`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="PreferencesThreads"
        getComponent={() => ThreadPreferencesScreen}
        options={{title: title(msg`Threads Preferences`), requireAuth: true}}
      />
      <Stack.Screen
        name="PreferencesExternalEmbeds"
        getComponent={() => ExternalMediaPreferencesScreen}
        options={{
          title: title(msg`External Media Preferences`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AccessibilitySettings"
        getComponent={() => AccessibilitySettingsScreen}
        options={{
          title: title(msg`Accessibility Settings`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        getComponent={() => AppearanceSettingsScreen}
        options={{
          title: title(msg`Appearance`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AccountSettings"
        getComponent={() => AccountSettingsScreen}
        options={{
          title: title(msg`Account`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="BetaFeaturesSettings"
        getComponent={() => BetaFeaturesSettingsScreen}
        options={{
          title: title(msg`Beta features`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AutomationLabelSettings"
        getComponent={() => AutomationLabelSettingsScreen}
        options={{
          title: title(msg`Automation Label`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="PrivacyAndSecuritySettings"
        getComponent={() => PrivacyAndSecuritySettingsScreen}
        options={{
          title: title(msg`Privacy and Security`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ActivityPrivacySettings"
        getComponent={() => ActivityPrivacySettingsScreen}
        options={{
          title: title(msg`Privacy and Security`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="FindContactsSettings"
        getComponent={() => FindContactsSettingsScreen}
        options={{
          title: title(msg`Find Contacts`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        getComponent={() => NotificationSettingsScreen}
        options={{title: title(msg`Notification settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="ActivityNotificationSettings"
        getComponent={() => ActivityNotificationSettingsScreen}
        options={{
          title: title(msg`Activity notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="ContentAndMediaSettings"
        getComponent={() => ContentAndMediaSettingsScreen}
        options={{
          title: title(msg`Content and Media`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="InterestsSettings"
        getComponent={() => InterestsSettingsScreen}
        options={{
          title: title(msg`Your interests`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AboutSettings"
        getComponent={() => AboutSettingsScreen}
        options={{
          title: title(msg`About`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="AppIconSettings"
        getComponent={() => AppIconSettingsScreen}
        options={{
          title: title(msg`App Icon`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Hashtag"
        getComponent={() => HashtagScreen}
        options={{title: title(msg`Hashtag`)}}
      />
      <Stack.Screen
        name="Topic"
        getComponent={() => TopicScreen}
        options={{title: title(msg`Topic`)}}
      />
      <Stack.Group screenLayout={renderMessagesSplitViewLayout}>
        <Stack.Screen
          name="MessagesConversation"
          getComponent={() => MessagesConversationScreen}
          options={{title: title(msg`Chat`), requireAuth: true}}
        />
        <Stack.Screen
          name="MessagesConversationSettings"
          getComponent={() => MessagesConversationSettingsScreen}
          options={{title: title(msg`Group chat settings`), requireAuth: true}}
        />
        <Stack.Screen
          name="MessagesJoinRequests"
          getComponent={() => MessagesJoinRequestsScreen}
          options={{title: title(msg`Requests to join`), requireAuth: true}}
        />
        <Stack.Screen
          name="MessagesSettings"
          getComponent={() => MessagesSettingsScreen}
          options={{title: title(msg`Chat settings`), requireAuth: true}}
        />
        <Stack.Screen
          name="MessagesInbox"
          getComponent={() => MessagesInboxScreen}
          options={{title: title(msg`Chat request inbox`), requireAuth: true}}
        />
      </Stack.Group>
      <Stack.Screen
        name="NotificationsActivityList"
        getComponent={() => NotificationsActivityListScreen}
        options={{title: title(msg`Notifications`), requireAuth: true}}
      />
      <Stack.Screen
        name="LegacyNotificationSettings"
        getComponent={() => LegacyNotificationSettingsScreen}
        options={{title: title(msg`Notification settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="Feeds"
        getComponent={() => FeedsScreen}
        options={{title: title(msg`Feeds`)}}
      />
      <Stack.Screen
        name="StarterPack"
        getComponent={() => StarterPackScreen}
        options={{title: title(msg`Starter Pack`)}}
      />
      <Stack.Screen
        name="StarterPackShort"
        getComponent={() => StarterPackScreenShort}
        options={{title: title(msg`Starter Pack`)}}
      />
      <Stack.Screen
        name="StarterPackWizard"
        getComponent={() => Wizard}
        options={{title: title(msg`Create a Starter Pack`), requireAuth: true}}
      />
      <Stack.Screen
        name="StarterPackEdit"
        getComponent={() => Wizard}
        options={{title: title(msg`Edit your Starter Pack`), requireAuth: true}}
      />
      <Stack.Screen
        name="VideoFeed"
        getComponent={() => VideoFeed}
        options={{
          title: title(msg`Video Feed`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="Bookmarks"
        getComponent={() => BookmarksScreen}
        options={{
          title: title(msg`Saved Posts`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="FindContactsFlow"
        getComponent={() => FindContactsFlowScreen}
        options={{
          title: title(msg`Find Contacts`),
          requireAuth: true,
          gestureEnabled: false,
        }}
      />
    </>
  )
}

/**
 * The TabsNavigator is used by native mobile to represent the routes
 * in 3 distinct tab-stacks with a different root screen on each.
 */
type TabsLayout = (props: {children: React.ReactNode}) => React.ReactElement

function TabsNavigator({layout}: {layout: TabsLayout}) {
  const hasNativeTabs = useHasNativeTabs()
  if (hasNativeTabs) {
    return <NativeTabsNavigator layout={layout} />
  }
  return <JSTabsNavigator layout={layout} />
}

function JSTabsNavigator({layout}: {layout: TabsLayout}) {
  const tabBar = useCallback(
    (props: JSX.IntrinsicAttributes & BottomTabBarProps) => (
      <NativeTabBar {...props} />
    ),
    [],
  )

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{headerShown: false, lazy: true}}
      tabBar={tabBar}
      layout={layout}>
      <Tab.Screen name="HomeTab" getComponent={() => HomeTabNavigator} />
      <Tab.Screen name="SearchTab" getComponent={() => SearchTabNavigator} />
      <Tab.Screen
        name="MessagesTab"
        getComponent={() => MessagesTabNavigator}
      />
      <Tab.Screen
        name="NotificationsTab"
        getComponent={() => NotificationsTabNavigator}
      />
      <Tab.Screen
        name="MyProfileTab"
        getComponent={() => MyProfileTabNavigator}
      />
      <Tab.Screen
        name="AtmosphereTab"
        getComponent={() => AtmosphereTabNavigator}
      />
      <Tab.Screen name="FeedsTab" getComponent={() => FeedsTabNavigator} />
      <Tab.Screen name="ListsTab" getComponent={() => ListsTabNavigator} />
      <Tab.Screen
        name="BookmarksTab"
        getComponent={() => BookmarksTabNavigator}
      />
      <Tab.Screen
        name="SettingsTab"
        getComponent={() => SettingsTabNavigator}
      />
    </Tab.Navigator>
  )
}

function nanoTabIcon(glyph: string) {
  /*
   * The symbol sets in `app.config.js` are built from our icon SVGs, and
   * react-native-screens falls back to the asset catalog when a name isn't one
   * of Apple's SF Symbols.
   */
  return nativeNanoSymbol(glyph) as NativeBottomTabIcon
}

/**
 * Native tabs, used on Liquid Glass iPhones and while the system places a
 * vertical bar (iPhone Duo), where UIKit moves the tab bar into it. See
 * `useNativeTabBarPlacement`.
 *
 * Native tabs can't hide individual tabs, so this only holds the primary
 * tabs. The secondary destinations (Feeds, Lists, Settings, etc.) open in the
 * current tab's stack instead, see `navigateToSecondaryTab` in the drawer.
 */
/**
 * Screens that hide the JS bottom bar, via `Layout.Screen`'s `minimalShell`.
 * The native tab bar can't be hidden from inside a screen, so these are hidden
 * by route name instead - keep the two in sync.
 */
const ROUTES_WITHOUT_BOTTOM_TAB_BAR = new Set<string>([
  'MessagesConversation',
  'VideoFeed',
  'StarterPackWizard',
  'StarterPackEdit',
  'InviteScanner',
])

/**
 * Native tab badges only hold text, so the "something new" dot is a dot
 * character, with a clear badge background and our blue text (needs the
 * `react-native-screens` and `@react-navigation/bottom-tabs` patches for the
 * text color). An empty badge would be dropped, see the patch notes.
 */
const DOT_BADGE = '\u25CF'

/**
 * Gives a tab its own safe area, measured from inside the tab. UIKit includes
 * the native tab bar in that, so content can clear it (and follow it as it
 * shows and hides) with the usual `useSafeAreaInsets().bottom`.
 */
function NativeTabSafeAreaProvider({children}: {children: React.ReactNode}) {
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()
  return (
    <SafeAreaProvider initialMetrics={{insets, frame}}>
      {children}
    </SafeAreaProvider>
  )
}

function NativeTabsNavigator({layout}: {layout: TabsLayout}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const {hasSession, currentAccount} = useSession()
  const onboardingState = useOnboardingState()
  const {showLoggedOut} = useLoggedOutView()
  const {footerHeight} = useShellLayout()
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  const {gtMobile} = useBreakpoints()
  const profileTabIcon = useProfileTabIcon()
  const placement = useNativeTabBarPlacement()
  const hasHomeBadge = useHomeBadge()
  const dotBadgeStyle = {
    backgroundColor: 'transparent',
    color: t.palette.primary_500,
  }

  /*
   * There's no JS bottom bar. Content clears the native one with the bottom
   * safe area inset instead, see `NativeTabSafeAreaProvider`.
   */
  useEffect(() => {
    footerHeight.set(0)
  }, [footerHeight])

  useEffect(() => {
    setNativeTabsMounted(true)
    return () => setNativeTabsMounted(false)
  }, [])

  NativeTab ??= createNativeBottomTabNavigator<BottomTabNavigatorParams>()

  const isAuthSurface =
    !hasSession ||
    !!currentAccount?.signupQueued ||
    showLoggedOut ||
    onboardingState.isActive

  return (
    <NativeTab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      layout={props =>
        layout({
          ...props,
          children: (
            <>
              {props.children}
              <NativeTabsSidebar
                state={props.state}
                navigation={props.navigation}
              />
            </>
          ),
        })
      }
      screenLayout={({children}) => (
        <NativeTabSafeAreaProvider>{children}</NativeTabSafeAreaProvider>
      )}
      screenOptions={({route}) => ({
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: t.atoms.text.color,
        // Match the JS tab bar's unread badges, which are blue rather than red
        tabBarBadgeStyle: {
          backgroundColor: t.palette.primary_500,
          color: t.palette.white,
        },
        /*
         * The native default turns on `automatic` content insets for the first
         * ScrollView in each tab, which would double the insets that our
         * screens already pad by hand.
         */
        overrideScrollViewContentInsetAdjustmentBehavior: false,
        tabBarStyle: {
          /*
           * Native tabs stay mounted when the layout widens (the Duo unfolding,
           * an iPhone rotating), since switching navigators would lose the
           * navigation state, but hide the tab bar for the sidebar. In the
           * vertical bar it never covers content, so it only hides for
           * full-screen flows, not for the screens that hide the JS one.
           */
          display:
            gtMobile ||
            isAuthSurface ||
            (placement === 'bottom' &&
              ROUTES_WITHOUT_BOTTOM_TAB_BAR.has(
                getFocusedRouteNameFromRoute(route) ?? '',
              ))
              ? 'none'
              : 'flex',
        },
      })}
      screenListeners={({navigation, route}) => ({
        tabPress: () => {
          const tab = route.name.replace(/Tab$/, '') as SharedNavTab
          ax.metric('nav:click', {
            item: TAB_TO_NAV_ITEM[tab],
            surface: 'bottomBar',
          })
          /*
           * Native tabs pop to the root and scroll to the top when the
           * selected tab is pressed again. At the root, also soft reset, like
           * the JS tab bar does.
           */
          if (
            getTabState(navigation.getState(), tab) === TabState.InsideAtRoot
          ) {
            emitSoftReset()
          }
        },
      })}>
      <NativeTab.Screen
        name="HomeTab"
        getComponent={() => HomeTabNavigator}
        options={{
          title: l`Home`,
          ...(hasHomeBadge &&
            isFollowingV2HomeDotEnabled(ax) && {
              tabBarBadge: DOT_BADGE,
              tabBarBadgeStyle: dotBadgeStyle,
            }),
          tabBarIcon: ({focused}) =>
            nanoTabIcon(
              focused
                ? 'HomeOpen_Filled_Corner0_Rounded'
                : 'HomeOpen_Stroke2_Corner0_Rounded',
            ),
        }}
      />
      <NativeTab.Screen
        name="SearchTab"
        getComponent={() => SearchTabNavigator}
        options={{
          title: l`Search`,
          tabBarIcon: ({focused}) =>
            nanoTabIcon(
              focused
                ? 'MagnifyingGlass_Filled_Stroke2_Corner0_Rounded'
                : 'MagnifyingGlass_Stroke2_Corner0_Rounded',
            ),
        }}
      />
      <NativeTab.Screen
        name="MessagesTab"
        getComponent={() => MessagesTabNavigator}
        options={{
          title: l`Chat`,
          tabBarIcon: ({focused}) =>
            nanoTabIcon(
              focused
                ? 'Message_Stroke2_Corner0_Rounded_Filled'
                : 'Message_Stroke2_Corner0_Rounded',
            ),
          ...(aa.flags.chatDisabled
            ? null
            : numUnreadMessages.numUnread
              ? {tabBarBadge: numUnreadMessages.numUnread}
              : // e.g. only chat requests
                numUnreadMessages.hasNew && {
                  tabBarBadge: DOT_BADGE,
                  tabBarBadgeStyle: dotBadgeStyle,
                }),
        }}
      />
      <NativeTab.Screen
        name="NotificationsTab"
        getComponent={() => NotificationsTabNavigator}
        options={{
          title: l`Notifications`,
          tabBarIcon: ({focused}) =>
            nanoTabIcon(
              focused
                ? 'Bell_Filled_Corner0_Rounded'
                : 'Bell_Stroke2_Corner0_Rounded',
            ),
          tabBarBadge: numUnreadNotifications || undefined,
        }}
      />
      <NativeTab.Screen
        name="MyProfileTab"
        getComponent={() => MyProfileTabNavigator}
        options={{
          title: l`Profile`,
          tabBarIcon: ({focused}) =>
            profileTabIcon ??
            nanoTabIcon(
              focused
                ? 'UserCircle_Filled_Corner0_Rounded'
                : 'UserCircle_Stroke2_Corner0_Rounded',
            ),
        }}
      />
    </NativeTab.Navigator>
  )
}

function SecondaryTabNavigator({
  initialRouteName,
}: {
  initialRouteName: keyof CommonNavigatorParams
}) {
  const t = useTheme()
  return (
    <SecondaryTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName={initialRouteName}>
      {commonScreens(SecondaryTab as typeof Flat)}
    </SecondaryTab.Navigator>
  )
}

function AtmosphereTabNavigator() {
  return <SecondaryTabNavigator initialRouteName="Atmosphere" />
}

function FeedsTabNavigator() {
  return <SecondaryTabNavigator initialRouteName="Feeds" />
}

function ListsTabNavigator() {
  return <SecondaryTabNavigator initialRouteName="Lists" />
}

function BookmarksTabNavigator() {
  return <SecondaryTabNavigator initialRouteName="Bookmarks" />
}

function SettingsTabNavigator() {
  return <SecondaryTabNavigator initialRouteName="Settings" />
}

function NativeTabBar(props: BottomTabBarProps) {
  const {gtMobile} = useBreakpoints()
  const {hasSession, currentAccount} = useSession()
  const onboardingState = useOnboardingState()
  const {showLoggedOut} = useLoggedOutView()
  const {footerHeight} = useShellLayout()
  const currentRouteName = getCurrentRoute(props.state).name
  const {showTabletSidebar, hideTabBar} = getNativeTabBarVisibility({
    gtMobile,
    hasSession,
    signupQueued: !!currentAccount?.signupQueued,
    showLoggedOut,
    onboardingActive: onboardingState.isActive,
    isVideoFeed: currentRouteName === 'VideoFeed',
  })

  useEffect(() => {
    if (showTabletSidebar || hideTabBar) {
      footerHeight.set(0)
    }
  }, [showTabletSidebar, hideTabBar, footerHeight])

  if (hideTabBar) {
    return null
  }

  if (showTabletSidebar) {
    return (
      <DesktopLeftNav
        routeName={currentRouteName}
        onNavigateTab={tab => navigateToSidebarTab(props.navigation, tab)}
      />
    )
  }

  return <BottomBar {...props} />
}

type SecondarySidebarTab =
  'Atmosphere' | 'Feeds' | 'Lists' | 'Bookmarks' | 'Settings'

function isSecondarySidebarTab(tab: SidebarTab): tab is SecondarySidebarTab {
  return (
    tab === 'Atmosphere' ||
    tab === 'Feeds' ||
    tab === 'Lists' ||
    tab === 'Bookmarks' ||
    tab === 'Settings'
  )
}

function navigateToSidebarTab(
  navigation: NavigationHelpers<ParamListBase>,
  tab: SidebarTab,
  {hasNativeTabs = false}: {hasNativeTabs?: boolean} = {},
) {
  const state = navigation.getState()
  const tabState = getTabState(state, tab)
  if (tabState === TabState.InsideAtRoot) {
    emitSoftReset()
  } else if (hasNativeTabs && isSecondarySidebarTab(tab)) {
    // Native tabs only hold the primary tabs, so open it in the current one
    navigation.dispatch(
      getCommonNavigationAction({name: tab, params: undefined}, state),
    )
  } else if (tabState === TabState.Inside) {
    const target = state.routes.find(route => route.name === `${tab}Tab`)?.state
      ?.key
    if (target) {
      navigation.dispatch({
        ...StackActions.popToTop(),
        target,
      })
    } else {
      navigation.reset({
        index: 0,
        routes: [{name: `${tab}Tab`}],
      })
    }
  } else {
    // The tab navigator route names mirror the shared navigation tab names.
    navigation.navigate(`${tab}Tab`)
  }
}

/**
 * The tablet sidebar for native tabs, which have no custom tab bar. Rendered
 * over the tabs, like the JS tab navigator renders it as its tab bar.
 */
function NativeTabsSidebar({
  state,
  navigation,
}: {
  state: TabNavigationState<ParamListBase>
  navigation: NavigationHelpers<ParamListBase>
}) {
  const {gtMobile} = useBreakpoints()
  const {hasSession, currentAccount} = useSession()
  const onboardingState = useOnboardingState()
  const {showLoggedOut} = useLoggedOutView()
  const currentRouteName = getCurrentRoute(state).name
  const {showTabletSidebar} = getNativeTabBarVisibility({
    gtMobile,
    hasSession,
    signupQueued: !!currentAccount?.signupQueued,
    showLoggedOut,
    onboardingActive: onboardingState.isActive,
    isVideoFeed: currentRouteName === 'VideoFeed',
  })

  if (!showTabletSidebar) {
    return null
  }

  return (
    <DesktopLeftNav
      routeName={currentRouteName}
      onNavigateTab={tab =>
        navigateToSidebarTab(navigation, tab, {hasNativeTabs: true})
      }
    />
  )
}

function screenOptions(t: Theme) {
  return {
    fullScreenGestureEnabled: true,
    headerShown: false,
    contentStyle: t.atoms.bg,
  } as const
}

function HomeTabNavigator() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const BLURRED_SCROLL_EDGE_EFFECT =
    IS_LIQUID_GLASS && !gtMobile
      ? ({
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackVisible: false,
          scrollEdgeEffects: {
            top: 'soft',
          },
        } as const)
      : {}

  return (
    <HomeTab.Navigator screenOptions={screenOptions(t)} initialRouteName="Home">
      <HomeTab.Screen
        name="Home"
        getComponent={() => HomeScreen}
        options={BLURRED_SCROLL_EDGE_EFFECT}
      />
      <HomeTab.Screen
        name="Start"
        getComponent={() => HomeScreen}
        options={BLURRED_SCROLL_EDGE_EFFECT}
      />
      {commonScreens(HomeTab as typeof Flat)}
    </HomeTab.Navigator>
  )
}

function SearchTabNavigator() {
  const t = useTheme()
  return (
    <SearchTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="Search">
      <SearchTab.Screen name="Search" getComponent={() => SearchScreen} />
      {commonScreens(SearchTab as typeof Flat)}
    </SearchTab.Navigator>
  )
}

function NotificationsTabNavigator() {
  const t = useTheme()
  return (
    <NotificationsTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="Notifications">
      <NotificationsTab.Screen
        name="Notifications"
        getComponent={() => NotificationsScreen}
        options={{requireAuth: true}}
      />
      {commonScreens(NotificationsTab as typeof Flat)}
    </NotificationsTab.Navigator>
  )
}

function MyProfileTabNavigator() {
  const t = useTheme()
  return (
    <MyProfileTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="MyProfile">
      <MyProfileTab.Screen
        // MyProfile is not in AllNavigationParams - asserting as Profile at least
        // gives us typechecking for initialParams -sfn
        name={'MyProfile' as 'Profile'}
        getComponent={() => ProfileScreen}
        initialParams={{name: 'me', hideBackButton: true}}
      />
      {commonScreens(MyProfileTab as unknown as typeof Flat)}
    </MyProfileTab.Navigator>
  )
}

function MessagesTabNavigator() {
  const t = useTheme()
  return (
    <MessagesTab.Navigator
      screenOptions={screenOptions(t)}
      initialRouteName="Messages">
      <MessagesTab.Screen
        name="Messages"
        getComponent={() => MessagesScreen}
        options={({route}) => ({
          requireAuth: true,
          animationTypeForReplace: route.params?.animation ?? 'push',
        })}
      />
      {commonScreens(MessagesTab as typeof Flat)}
    </MessagesTab.Navigator>
  )
}

/**
 * The FlatNavigator is used by Web to represent the routes
 * in a single ("flat") stack.
 */
const FlatNavigator = ({
  layout,
}: {
  layout: React.ComponentProps<typeof Flat.Navigator>['layout']
}) => {
  const t = useTheme()
  const numUnread = useUnreadNotifications()
  const screenListeners = useWebScrollRestoration()
  const title = (page: MessageDescriptor) => bskyTitle(i18n._(page), numUnread)

  return (
    <Flat.Navigator
      layout={layout}
      screenListeners={screenListeners}
      screenOptions={screenOptions(t)}>
      <Flat.Screen
        name="Home"
        getComponent={() => HomeScreen}
        options={{title: title(msg`Home`)}}
      />
      <Flat.Screen
        name="Search"
        getComponent={() => SearchScreen}
        options={{title: title(msg`Explore`)}}
      />
      <Flat.Screen
        name="Notifications"
        getComponent={() => NotificationsScreen}
        options={{title: title(msg`Notifications`), requireAuth: true}}
      />
      <Flat.Screen
        name="Messages"
        getComponent={() => MessagesScreen}
        options={{title: title(msg`Messages`), requireAuth: true}}
        layout={renderMessagesSplitViewLayout}
      />
      <Flat.Screen
        name="Start"
        getComponent={() => HomeScreen}
        options={{title: title(msg`Home`)}}
      />
      {commonScreens(Flat, numUnread)}
    </Flat.Navigator>
  )
}

let didHandlePushNotificationEntry = false

/** Wrap components that need access to the navigation context. */
function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  const ax = useAnalytics()
  // eslint-disable-next-line react-compiler/react-compiler
  const notyLogger = ax.logger.useChild(ax.logger.Context.Notifications)
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme)
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const previousScreen = useRef<string | undefined>(undefined)
  const emailDialogControl = useEmailDialogControl()
  const closeAllActiveElements = useCloseAllActiveElements()
  const linkingUrl = Linking.useLinkingURL()

  /**
   * Handle navigation to the messages tab, or prepares for account switch.
   *
   * Non-reactive because we need the latest data from some hooks
   * after an async call - sfn
   */
  const handleChatNotification = useNonReactiveCallback(
    (payload: ChatNotificationPayload) => {
      notyLogger.debug(`handleChatNotification`, {payload})

      if (payload.recipientDid !== currentAccount?.did) {
        // handled in useNotificationHandler after account switch finishes
        storePayloadForAccountSwitch(payload)
        closeAllActiveElements()

        const account = accounts.find(a => a.did === payload.recipientDid)
        if (account) {
          void onPressSwitchAccount(account, 'Notification')
        } else {
          setShowLoggedOut(true)
        }
      } else if (
        payload.reason === 'chat-message' ||
        payload.reason === 'chat-reaction' ||
        payload.reason === 'chat-added-to-group'
      ) {
        // chat-added-to-group routes to the convo because the recipient was
        // just added and now has access.
        void dispatchNavigationAction(
          getMessagesNavigationAction({pushToConversation: payload.convoId}),
        )
      } else {
        // chat-removed-from-group, chat-join-request-rejected: the convo is
        // no longer accessible to the recipient, so just open the list.
        void dispatchNavigationAction(getMessagesNavigationAction())
      }
    },
  )

  function handlePushNotificationEntry() {
    if (!IS_NATIVE) return

    // Only consume a launching notification once per JS runtime. Account
    // switches remount the entire tree (see `key={currentAccount?.did}` in
    // `App.native.tsx`), which re-fires `onNavigationReady` and would
    // otherwise re-process whatever `getLastNotificationResponse` still has
    // cached natively (APP-2338).
    if (didHandlePushNotificationEntry) return
    didHandlePushNotificationEntry = true

    // intent urls are handled by `useIntentHandler`
    if (linkingUrl) return

    const notificationResponse = Notifications.getLastNotificationResponse()

    if (notificationResponse) {
      notyLogger.debug(`handlePushNotificationEntry: response`, {
        response: notificationResponse,
      })

      // Clear the last notification response to ensure it's not used again
      try {
        Notifications.clearLastNotificationResponse()
      } catch (error) {
        notyLogger.error(
          `handlePushNotificationEntry: error clearing notification response`,
          {error},
        )
      }

      const payload = getNotificationPayload(notificationResponse.notification)

      if (payload) {
        ax.metric('notifications:openApp', {
          reason: payload.reason,
          causedBoot: true,
        })

        if (isChatNotificationPayload(payload)) {
          handleChatNotification(payload)
        } else {
          const path = notificationToURL(payload)

          if (path === '/notifications') {
            resetToTab('Notifications')
            notyLogger.debug(`handlePushNotificationEntry: default navigate`)
          } else if (path) {
            const [screen, params] = router.matchPath(path)
            void navigateToPath(path)
            notyLogger.debug(`handlePushNotificationEntry: navigate`, {
              screen,
              params,
            })
          }
        }
      }
    }
  }

  const onNavigationReady = useCallOnce(() => {
    const currentScreen = getCurrentRouteName()
    setNavigationMetadata({
      previousScreen: currentScreen,
      currentScreen,
    })
    previousScreen.current = currentScreen

    handlePushNotificationEntry()

    ax.metric('router:navigate', {})

    if (currentAccount && shouldRequestEmailConfirmation(currentAccount)) {
      emailDialogControl.open({
        id: EmailDialogScreenID.VerificationReminder,
      })
      snoozeEmailConfirmationPrompt()
    }

    ax.metric('init', {
      initMs: Math.round(
        // @ts-expect-error Emitted by Metro in the bundle prelude
        performance.now() - global.__BUNDLE_START_TIME__,
      ),
    })

    if (IS_WEB) {
      void Referrer.getReferrerInfo().then(referrerInfo => {
        if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
          ax.metric('deepLink:referrerReceived', {
            to: window.location.href,
            referrer: referrerInfo?.referrer,
            hostname: referrerInfo?.hostname,
          })
        }
      })
    }

    // temp, just testing
    void ax.features.enabled(ax.features.AATest)
  })

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={LINKING}
      theme={theme}
      onStateChange={() => {
        const currentScreen = getCurrentRouteName()
        // do this before metric
        setNavigationMetadata({
          previousScreen: previousScreen.current,
          currentScreen,
        })
        ax.metric('router:navigate', {from: previousScreen.current})
        previousScreen.current = currentScreen
      }}
      onReady={onNavigationReady}
      // WARNING: Implicit navigation to nested navigators is depreciated in React Navigation 7.x
      // However, there's a fair amount of places we do that, especially in when popping to the top of stacks.
      // See BottomBar.tsx for an example of how to handle nested navigators in the tabs correctly.
      // I'm scared of missing a spot (esp. with push notifications etc) so let's enable this legacy behaviour for now.
      // We will need to confirm we handle nested navigators correctly by the time we migrate to React Navigation 8.x
      // -sfn
      navigationInChildEnabled>
      {children}
    </NavigationContainer>
  )
}

function getCurrentRouteName() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name
  } else {
    return undefined
  }
}

/**
 * These helpers can be used from outside of the RoutesContainer
 * (eg in the state models).
 */

function navigate(destination: CommonNavigationDestination) {
  return dispatchNavigationAction(
    getCommonNavigationAction(
      destination,
      navigationRef.isReady() ? navigationRef.getRootState() : undefined,
    ),
  )
}

/** Reuse the container's linking rules for notification URLs. */
function navigateToPath(path: string) {
  const action = getNavigationActionFromPath(path)
  if (action) return dispatchNavigationAction(action)
  return Promise.resolve()
}

function dispatchNavigationAction(action: NavigationAction) {
  if (navigationRef.isReady()) {
    return Promise.race([
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)

        navigationRef.dispatch(action)
      }),
      timeout(1e3),
    ])
  }
  return Promise.resolve()
}

function resetToTab(tabName: 'Home' | 'Search' | 'Messages' | 'Notifications') {
  if (navigationRef.isReady()) {
    void dispatchNavigationAction(getTabNavigationAction(tabName))
    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(StackActions.popToTop()) //we need to check .canGoBack() before calling it
    }
  }
}

// returns a promise that resolves after the state reset is complete
function reset(): Promise<void> {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(getTabResetAction('Home'))
    return Promise.race([
      timeout(1e3),
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)
      }),
    ])
  } else {
    return Promise.resolve()
  }
}

export {
  FlatNavigator,
  navigate,
  navigateToPath,
  reset,
  resetToTab,
  RoutesContainer,
  TabsNavigator,
}
