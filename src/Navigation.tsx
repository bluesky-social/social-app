import {type JSX, useCallback, useRef} from 'react'
import * as Linking from 'expo-linking'
import * as Notifications from 'expo-notifications'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'
import {
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs'
import {
  CommonActions,
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  type LinkingOptions,
  NavigationContainer,
  StackActions,
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
import {buildStateObject, getCurrentRoute} from '#/lib/routes/helpers'
import {
  type AllNavigatorParams,
  type BottomTabNavigatorParams,
  type FlatNavigatorParams,
  type HomeTabNavigatorParams,
  type MessagesTabNavigatorParams,
  type MyProfileTabNavigatorParams,
  type NotificationsTabNavigatorParams,
  type RouteParams,
  type SearchTabNavigatorParams,
  type State,
} from '#/lib/routes/types'
import {bskyTitle} from '#/lib/strings/headings'
import {CHAT_INVITE_CODE_REGEX} from '#/lib/strings/url-helpers'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {
  shouldRequestEmailConfirmation,
  snoozeEmailConfirmationPrompt,
} from '#/state/shell/reminders'
import {useCloseAllActiveElements} from '#/state/util'
import {CommunityGuidelinesScreen} from '#/view/screens/CommunityGuidelines'
import {CopyrightPolicyScreen} from '#/view/screens/CopyrightPolicy'
import {DebugModScreen} from '#/view/screens/DebugMod'
import {FeedsScreen} from '#/view/screens/Feeds'
import {HomeScreen} from '#/view/screens/Home'
import {ListsScreen} from '#/view/screens/Lists'
import {ModerationBlockedAccounts} from '#/view/screens/ModerationBlockedAccounts'
import {ModerationModlistsScreen} from '#/view/screens/ModerationModlists'
import {ModerationMutedAccounts} from '#/view/screens/ModerationMutedAccounts'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {NotificationsScreen} from '#/view/screens/Notifications'
import {PostThreadScreen} from '#/view/screens/PostThread'
import {PrivacyPolicyScreen} from '#/view/screens/PrivacyPolicy'
import {ProfileScreen} from '#/view/screens/Profile'
import {ProfileFeedLikedByScreen} from '#/view/screens/ProfileFeedLikedBy'
import {StorybookScreen} from '#/view/screens/Storybook'
import {SupportScreen} from '#/view/screens/Support'
import {TermsOfServiceScreen} from '#/view/screens/TermsOfService'
import {BottomBar} from '#/view/shell/bottom-bar/BottomBar'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {BookmarksScreen} from '#/screens/Bookmarks'
import {SharedPreferencesTesterScreen} from '#/screens/E2E/SharedPreferencesTesterScreen'
import {FindContactsFlowScreen} from '#/screens/FindContactsFlowScreen'
import HashtagScreen from '#/screens/Hashtag'
import {LogScreen} from '#/screens/Log'
import {MessagesScreen} from '#/screens/Messages/ChatList'
import {MessagesConversationScreen} from '#/screens/Messages/Conversation'
import {MessagesConversationSettingsScreen} from '#/screens/Messages/ConversationSettings'
import {MessagesInboxScreen} from '#/screens/Messages/Inbox'
import {MessagesJoinRequestsScreen} from '#/screens/Messages/JoinRequests'
import {MessagesSettingsScreen} from '#/screens/Messages/Settings'
import {ModerationScreen} from '#/screens/Moderation'
import {Screen as ModerationVerificationSettings} from '#/screens/Moderation/VerificationSettings'
import {Screen as ModerationInteractionSettings} from '#/screens/ModerationInteractionSettings'
import {NotificationsActivityListScreen} from '#/screens/Notifications/ActivityList'
import {PostLikedByScreen} from '#/screens/Post/PostLikedBy'
import {PostQuotesScreen} from '#/screens/Post/PostQuotes'
import {PostRepostedByScreen} from '#/screens/Post/PostRepostedBy'
import {ProfileKnownFollowersScreen} from '#/screens/Profile/KnownFollowers'
import {ProfileFeedScreen} from '#/screens/Profile/ProfileFeed'
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
import {ContentAndMediaSettingsScreen} from '#/screens/Settings/ContentAndMediaSettings'
import {ExternalMediaPreferencesScreen} from '#/screens/Settings/ExternalMediaPreferences'
import {FindContactsSettingsScreen} from '#/screens/Settings/FindContactsSettings'
import {FollowingFeedPreferencesScreen} from '#/screens/Settings/FollowingFeedPreferences'
import {InterestsSettingsScreen} from '#/screens/Settings/InterestsSettings'
import {LanguageSettingsScreen} from '#/screens/Settings/LanguageSettings'
import {LegacyNotificationSettingsScreen} from '#/screens/Settings/LegacyNotificationSettings'
import {NotificationSettingsScreen} from '#/screens/Settings/NotificationSettings'
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
import {type Theme, useTheme} from '#/alf'
import {
  EmailDialogScreenID,
  useEmailDialogControl,
} from '#/components/dialogs/EmailDialog'
import {useAnalytics} from '#/analytics'
import {setNavigationMetadata} from '#/analytics/metadata'
import {IS_LIQUID_GLASS, IS_NATIVE, IS_WEB} from '#/env'
import {InviteScannerScreen} from '#/features/inviteFriends'
import {router} from '#/routes'
import {Referrer} from '../modules/expo-bluesky-swiss-army'
import {renderMessagesSplitViewLayout} from './screens/Messages/components/splitView/MessagesSplitViewLayout'

const navigationRef = createNavigationContainerRef<AllNavigatorParams>()

const HomeTab = createNativeStackNavigatorWithAuth<HomeTabNavigatorParams>()
const SearchTab = createNativeStackNavigatorWithAuth<SearchTabNavigatorParams>()
const NotificationsTab =
  createNativeStackNavigatorWithAuth<NotificationsTabNavigatorParams>()
const MyProfileTab =
  createNativeStackNavigatorWithAuth<MyProfileTabNavigatorParams>()
const MessagesTab =
  createNativeStackNavigatorWithAuth<MessagesTabNavigatorParams>()
const Flat = createNativeStackNavigatorWithAuth<FlatNavigatorParams>()
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>()

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
        getId={({params}) => params.name}
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
        name="ProfileFeed"
        getComponent={() => ProfileFeedScreen}
        options={{title: title(msg`Feed`)}}
      />
      <Stack.Screen
        name="ProfileFeedLikedBy"
        getComponent={() => ProfileFeedLikedByScreen}
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
        options={{title: title(msg`Create a starter pack`), requireAuth: true}}
      />
      <Stack.Screen
        name="StarterPackEdit"
        getComponent={() => Wizard}
        options={{title: title(msg`Edit your starter pack`), requireAuth: true}}
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
function TabsNavigator({
  layout,
}: {
  layout: React.ComponentProps<typeof Tab.Navigator>['layout']
}) {
  const tabBar = useCallback(
    (props: JSX.IntrinsicAttributes & BottomTabBarProps) => (
      <BottomBar {...props} />
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
    </Tab.Navigator>
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

  const BLURRED_SCROLL_EDGE_EFFECT = IS_LIQUID_GLASS
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

/**
 * The RoutesContainer should wrap all components which need access
 * to the navigation context.
 */

const LINKING = {
  // TODO figure out what we are going to use
  // note: `bluesky://` is what is used in app.config.js
  prefixes: ['bsky://', 'bluesky://', 'https://bsky.app'],

  getPathFromState(state: State) {
    // find the current node in the navigation tree
    const node = getCurrentRoute(state)

    // build the path
    const route = router.matchName(node.name)
    if (typeof route === 'undefined') {
      return '/' // default to home
    }
    return route.build((node.params || {}) as RouteParams)
  },

  getStateFromPath(path: string) {
    const [name, params] = router.matchPath(path)

    // Any time we receive a url that starts with `intent/` we want to ignore it here. It will be handled in the
    // intent handler hook. We should check for the trailing slash, because if there isn't one then it isn't a valid
    // intent
    // On web, there is no route state that's created by default, so we should initialize it as the home route. On
    // native, since the home tab and the home screen are defined as initial routes, we don't need to return a state
    // since it will be created by react-navigation.
    if (path.includes('intent/')) {
      if (IS_NATIVE) return
      return buildStateObject('Flat', 'Home', params)
    }

    // Chat invite URLs (`/chat/:code`) are handled by `useIntentHandler`, which
    // opens the GroupChatJoinDialog (or the logged-out join flow). Route the
    // path to Home so the dialog overlays Home instead of NotFound. On native,
    // react-navigation strips the `bluesky://` prefix and passes the path
    // without a leading slash, so normalize before matching.
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    if (CHAT_INVITE_CODE_REGEX.test(normalizedPath.split('?')[0])) {
      if (IS_NATIVE) {
        return buildStateObject('HomeTab', 'Home', params)
      }
      return buildStateObject('Flat', 'Home', params)
    }

    if (IS_NATIVE) {
      if (name === 'Search') {
        return buildStateObject('SearchTab', 'Search', params)
      }
      if (name === 'Notifications') {
        return buildStateObject('NotificationsTab', 'Notifications', params)
      }
      if (name === 'Home') {
        return buildStateObject('HomeTab', 'Home', params)
      }
      if (name === 'Messages') {
        return buildStateObject('MessagesTab', 'Messages', params)
      }
      // if the path is something else, like a post, profile, or even settings, we need to initialize the home tab as pre-existing state otherwise the back button will not work
      return buildStateObject('HomeTab', name, params, [
        {
          name: 'Home',
          params: {},
        },
      ])
    } else {
      const res = buildStateObject('Flat', name, params)
      return res
    }
  },
} satisfies LinkingOptions<AllNavigatorParams>

let didHandlePushNotificationEntry = false

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
        // @ts-expect-error nested navigators aren't typed -sfn
        void navigate('MessagesTab', {
          screen: 'Messages',
          params: {
            pushToConversation: payload.convoId,
          },
        })
      } else {
        // chat-removed-from-group, chat-join-request-rejected: the convo is
        // no longer accessible to the recipient, so just open the list.
        // @ts-expect-error nested navigators aren't typed -sfn
        navigate('MessagesTab', {screen: 'Messages'})
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
            resetToTab('NotificationsTab')
            notyLogger.debug(`handlePushNotificationEntry: default navigate`)
          } else if (path) {
            const [screen, params] = router.matchPath(path)
            // @ts-expect-error nested navigators aren't typed -sfn
            void navigate('HomeTab', {screen, params})
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
        // @ts-ignore Emitted by Metro in the bundle prelude
        performance.now() - global.__BUNDLE_START_TIME__,
      ),
    })

    if (IS_WEB) {
      const referrerInfo = Referrer.getReferrerInfo()
      if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
        ax.metric('deepLink:referrerReceived', {
          to: window.location.href,
          referrer: referrerInfo?.referrer,
          hostname: referrerInfo?.hostname,
        })
      }
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

function navigate<K extends keyof AllNavigatorParams>(
  name: K,
  params?: AllNavigatorParams[K],
) {
  if (navigationRef.isReady()) {
    return Promise.race([
      new Promise<void>(resolve => {
        const handler = () => {
          resolve()
          navigationRef.removeListener('state', handler)
        }
        navigationRef.addListener('state', handler)

        // @ts-ignore I don't know what would make typescript happy but I have a life -prf
        navigationRef.navigate(name, params)
      }),
      timeout(1e3),
    ])
  }
  return Promise.resolve()
}

function resetToTab(
  tabName: 'HomeTab' | 'SearchTab' | 'MessagesTab' | 'NotificationsTab',
) {
  if (navigationRef.isReady()) {
    void navigate(tabName)
    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(StackActions.popToTop()) //we need to check .canGoBack() before calling it
    }
  }
}

// returns a promise that resolves after the state reset is complete
function reset(): Promise<void> {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: IS_NATIVE ? 'HomeTab' : 'Home'}],
      }),
    )
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
  reset,
  resetToTab,
  RoutesContainer,
  TabsNavigator,
}
