import {useCallback, useRef} from 'react'
import {Linking} from 'react-native'
import * as Notifications from 'expo-notifications'
import {i18n, type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/macro'
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
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {
  getNotificationPayload,
  type NotificationPayload,
  notificationToURL,
  storePayloadForAccountSwitch,
} from '#/lib/hooks/useNotificationHandler'
import {useWebScrollRestoration} from '#/lib/hooks/useWebScrollRestoration'
import {logger as notyLogger} from '#/lib/notifications/util'
import {buildStateObject} from '#/lib/routes/helpers'
import {
  type AllNavigatorParams,
  type BottomTabNavigatorParams,
  type FlatNavigatorParams,
  type HomeTabNavigatorParams,
  type MessagesTabNavigatorParams,
  type MyProfileTabNavigatorParams,
  type NotificationsTabNavigatorParams,
  type SearchTabNavigatorParams,
} from '#/lib/routes/types'
import {type RouteParams, type State} from '#/lib/routes/types'
import {attachRouteToLogEvents, logEvent} from '#/lib/statsig/statsig'
import {bskyTitle} from '#/lib/strings/headings'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useSession} from '#/state/session'
import {
  shouldRequestEmailConfirmation,
  snoozeEmailConfirmationPrompt,
} from '#/state/shell/reminders'
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
import {ProfileListScreen} from '#/view/screens/ProfileList'
import {SavedFeeds} from '#/view/screens/SavedFeeds'
import {Storybook} from '#/view/screens/Storybook'
import {SupportScreen} from '#/view/screens/Support'
import {TermsOfServiceScreen} from '#/view/screens/TermsOfService'
import {BottomBar} from '#/view/shell/bottom-bar/BottomBar'
import {createNativeStackNavigatorWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {BookmarksScreen} from '#/screens/Bookmarks'
import {SharedPreferencesTesterScreen} from '#/screens/E2E/SharedPreferencesTesterScreen'
import HashtagScreen from '#/screens/Hashtag'
import {LogScreen} from '#/screens/Log'
import {MessagesScreen} from '#/screens/Messages/ChatList'
import {MessagesConversationScreen} from '#/screens/Messages/Conversation'
import {MessagesInboxScreen} from '#/screens/Messages/Inbox'
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
import {SearchScreen} from '#/screens/Search'
import {AboutSettingsScreen} from '#/screens/Settings/AboutSettings'
import {AccessibilitySettingsScreen} from '#/screens/Settings/AccessibilitySettings'
import {AccountSettingsScreen} from '#/screens/Settings/AccountSettings'
import {ActivityPrivacySettingsScreen} from '#/screens/Settings/ActivityPrivacySettings'
import {AppearanceSettingsScreen} from '#/screens/Settings/AppearanceSettings'
import {AppIconSettingsScreen} from '#/screens/Settings/AppIconSettings'
import {AppPasswordsScreen} from '#/screens/Settings/AppPasswords'
import {ContentAndMediaSettingsScreen} from '#/screens/Settings/ContentAndMediaSettings'
import {ExternalMediaPreferencesScreen} from '#/screens/Settings/ExternalMediaPreferences'
import {FollowingFeedPreferencesScreen} from '#/screens/Settings/FollowingFeedPreferences'
import {InterestsSettingsScreen} from '#/screens/Settings/InterestsSettings'
import {LanguageSettingsScreen} from '#/screens/Settings/LanguageSettings'
import {LegacyNotificationSettingsScreen} from '#/screens/Settings/LegacyNotificationSettings'
import {NotificationSettingsScreen} from '#/screens/Settings/NotificationSettings'
import {ActivityNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/ActivityNotificationSettings'
import {LikeNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/LikeNotificationSettings'
import {LikesOnRepostsNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/LikesOnRepostsNotificationSettings'
import {MentionNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/MentionNotificationSettings'
import {MiscellaneousNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/MiscellaneousNotificationSettings'
import {NewFollowerNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/NewFollowerNotificationSettings'
import {QuoteNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/QuoteNotificationSettings'
import {ReplyNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/ReplyNotificationSettings'
import {RepostNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/RepostNotificationSettings'
import {RepostsOnRepostsNotificationSettingsScreen} from '#/screens/Settings/NotificationSettings/RepostsOnRepostsNotificationSettings'
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
import {router} from '#/routes'
import {Referrer} from '../modules/expo-bluesky-swiss-army'
import {useAccountSwitcher} from './lib/hooks/useAccountSwitcher'
import {useNonReactiveCallback} from './lib/hooks/useNonReactiveCallback'
import {useLoggedOutViewControls} from './state/shell/logged-out'
import {useCloseAllActiveElements} from './state/util'

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
        getComponent={() => Storybook}
        options={{title: title(msg`Storybook`), requireAuth: true}}
      />
      <Stack.Screen
        name="DebugMod"
        getComponent={() => DebugModScreen}
        options={{title: title(msg`Moderation states`), requireAuth: true}}
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
        name="NotificationSettings"
        getComponent={() => NotificationSettingsScreen}
        options={{title: title(msg`Notification settings`), requireAuth: true}}
      />
      <Stack.Screen
        name="ReplyNotificationSettings"
        getComponent={() => ReplyNotificationSettingsScreen}
        options={{
          title: title(msg`Reply notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="MentionNotificationSettings"
        getComponent={() => MentionNotificationSettingsScreen}
        options={{
          title: title(msg`Mention notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="QuoteNotificationSettings"
        getComponent={() => QuoteNotificationSettingsScreen}
        options={{
          title: title(msg`Quote notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="LikeNotificationSettings"
        getComponent={() => LikeNotificationSettingsScreen}
        options={{
          title: title(msg`Like notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="RepostNotificationSettings"
        getComponent={() => RepostNotificationSettingsScreen}
        options={{
          title: title(msg`Repost notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="NewFollowerNotificationSettings"
        getComponent={() => NewFollowerNotificationSettingsScreen}
        options={{
          title: title(msg`New follower notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="LikesOnRepostsNotificationSettings"
        getComponent={() => LikesOnRepostsNotificationSettingsScreen}
        options={{
          title: title(msg`Likes of your reposts notifications`),
          requireAuth: true,
        }}
      />
      <Stack.Screen
        name="RepostsOnRepostsNotificationSettings"
        getComponent={() => RepostsOnRepostsNotificationSettingsScreen}
        options={{
          title: title(msg`Reposts of your reposts notifications`),
          requireAuth: true,
        }}
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
        name="MiscellaneousNotificationSettings"
        getComponent={() => MiscellaneousNotificationSettingsScreen}
        options={{
          title: title(msg`Miscellaneous notifications`),
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
      <Stack.Screen
        name="MessagesConversation"
        getComponent={() => MessagesConversationScreen}
        options={{title: title(msg`Chat`), requireAuth: true}}
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
    </>
  )
}

/**
 * The TabsNavigator is used by native mobile to represent the routes
 * in 3 distinct tab-stacks with a different root screen on each.
 */
function TabsNavigator() {
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
      tabBar={tabBar}>
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

  return (
    <HomeTab.Navigator screenOptions={screenOptions(t)} initialRouteName="Home">
      <HomeTab.Screen name="Home" getComponent={() => HomeScreen} />
      <HomeTab.Screen name="Start" getComponent={() => HomeScreen} />
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
const FlatNavigator = () => {
  const t = useTheme()
  const numUnread = useUnreadNotifications()
  const screenListeners = useWebScrollRestoration()
  const title = (page: MessageDescriptor) => bskyTitle(i18n._(page), numUnread)

  return (
    <Flat.Navigator
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
    let node = state.routes[state.index || 0]
    while (node.state?.routes && typeof node.state?.index === 'number') {
      node = node.state?.routes[node.state?.index]
    }

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
      if (isNative) return
      return buildStateObject('Flat', 'Home', params)
    }

    if (isNative) {
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

/**
 * Used to ensure we don't handle the same notification twice
 */
let lastHandledNotificationDateDedupe: number | undefined

function RoutesContainer({children}: React.PropsWithChildren<{}>) {
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme)
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const prevLoggedRouteName = useRef<string | undefined>(undefined)
  const emailDialogControl = useEmailDialogControl()
  const closeAllActiveElements = useCloseAllActiveElements()

  /**
   * Handle navigation to a conversation, or prepares for account switch.
   *
   * Non-reactive because we need the latest data from some hooks
   * after an async call - sfn
   */
  const handleChatMessage = useNonReactiveCallback(
    (payload: Extract<NotificationPayload, {reason: 'chat-message'}>) => {
      notyLogger.debug(`handleChatMessage`, {payload})

      if (payload.recipientDid !== currentAccount?.did) {
        // handled in useNotificationHandler after account switch finishes
        storePayloadForAccountSwitch(payload)
        closeAllActiveElements()

        const account = accounts.find(a => a.did === payload.recipientDid)
        if (account) {
          onPressSwitchAccount(account, 'Notification')
        } else {
          setShowLoggedOut(true)
        }
      } else {
        // @ts-expect-error nested navigators aren't typed -sfn
        navigate('MessagesTab', {
          screen: 'Messages',
          params: {
            pushToConversation: payload.convoId,
          },
        })
      }
    },
  )

  async function handlePushNotificationEntry() {
    if (!isNative) return

    // deep links take precedence - on android,
    // getLastNotificationResponseAsync returns a "notification"
    // that is actually a deep link. avoid handling it twice -sfn
    if (await Linking.getInitialURL()) {
      return
    }

    /**
     * The notification that caused the app to open, if applicable
     */
    const response = await Notifications.getLastNotificationResponseAsync()

    if (response) {
      notyLogger.debug(`handlePushNotificationEntry: response`, {response})

      if (response.notification.date === lastHandledNotificationDateDedupe)
        return
      lastHandledNotificationDateDedupe = response.notification.date

      const payload = getNotificationPayload(response.notification)

      if (payload) {
        notyLogger.metric(
          'notifications:openApp',
          {reason: payload.reason, causedBoot: true},
          {statsig: false},
        )

        if (payload.reason === 'chat-message') {
          handleChatMessage(payload)
        } else {
          const path = notificationToURL(payload)

          if (path === '/notifications') {
            resetToTab('NotificationsTab')
            notyLogger.debug(`handlePushNotificationEntry: default navigate`)
          } else if (path) {
            const [screen, params] = router.matchPath(path)
            // @ts-expect-error nested navigators aren't typed -sfn
            navigate('HomeTab', {screen, params})
            notyLogger.debug(`handlePushNotificationEntry: navigate`, {
              screen,
              params,
            })
          }
        }
      }
    }
  }

  function onReady() {
    prevLoggedRouteName.current = getCurrentRouteName()
    if (currentAccount && shouldRequestEmailConfirmation(currentAccount)) {
      emailDialogControl.open({
        id: EmailDialogScreenID.VerificationReminder,
      })
      snoozeEmailConfirmationPrompt()
    }
  }

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        linking={LINKING}
        theme={theme}
        onStateChange={() => {
          logger.metric(
            'router:navigate',
            {from: prevLoggedRouteName.current},
            {statsig: false},
          )
          prevLoggedRouteName.current = getCurrentRouteName()
        }}
        onReady={() => {
          attachRouteToLogEvents(getCurrentRouteName)
          logModuleInitTime()
          onReady()
          logger.metric('router:navigate', {}, {statsig: false})
          handlePushNotificationEntry()
        }}
        // WARNING: Implicit navigation to nested navigators is depreciated in React Navigation 7.x
        // However, there's a fair amount of places we do that, especially in when popping to the top of stacks.
        // See BottomBar.tsx for an example of how to handle nested navigators in the tabs correctly.
        // I'm scared of missing a spot (esp. with push notifications etc) so let's enable this legacy behaviour for now.
        // We will need to confirm we handle nested navigators correctly by the time we migrate to React Navigation 8.x
        // -sfn
        navigationInChildEnabled>
        {children}
      </NavigationContainer>
    </>
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

        // @ts-ignore I dont know what would make typescript happy but I have a life -prf
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
    navigate(tabName)
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
        routes: [{name: isNative ? 'HomeTab' : 'Home'}],
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

let didInit = false
function logModuleInitTime() {
  if (didInit) {
    return
  }
  didInit = true

  const initMs = Math.round(
    // @ts-ignore Emitted by Metro in the bundle prelude
    performance.now() - global.__BUNDLE_START_TIME__,
  )
  console.log(`Time to first paint: ${initMs} ms`)
  logEvent('init', {
    initMs,
  })

  if (isWeb) {
    const referrerInfo = Referrer.getReferrerInfo()
    if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
      logEvent('deepLink:referrerReceived', {
        to: window.location.href,
        referrer: referrerInfo?.referrer,
        hostname: referrerInfo?.hostname,
      })
    }
  }

  if (__DEV__) {
    // This log is noisy, so keep false committed
    const shouldLog = false
    // Relies on our patch to polyfill.js in metro-runtime
    const initLogs = (global as any).__INIT_LOGS__
    if (shouldLog && Array.isArray(initLogs)) {
      console.log(initLogs.join('\n'))
    }
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
