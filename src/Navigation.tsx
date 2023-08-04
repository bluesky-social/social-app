import * as React from "react";

import {
  AllNavigatorParams,
  BottomTabNavigatorParams,
  CommunitiesTabNavigatorParams,
  FeedsTabNavigatorParams,
  FlatNavigatorParams,
  HomeTabNavigatorParams,
  MyProfileTabNavigatorParams,
  NotificationsTabNavigatorParams,
  RewardsTabNavigatorParams,
  SearchTabNavigatorParams,
} from "lib/routes/types";
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
  CommonActions,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  StackActions,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { RouteParams, State } from "lib/routes/types";

import { AppPasswords } from "view/screens/AppPasswords";
import { BottomBar } from "./view/shell/bottom-bar/BottomBar";
import { BounceIn } from "react-native-reanimated";
import { CommunitiesScreen } from "view/screens/Communities";
import { CommunityFeedScreen } from "view/screens/CommunityFeedScreen";
import { CommunityGuidelinesScreen } from "./view/screens/CommunityGuidelines";
import { CopyrightPolicyScreen } from "./view/screens/CopyrightPolicy";
import { CustomFeedLikedByScreen } from "./view/screens/CustomFeedLikedBy";
import { CustomFeedScreen } from "./view/screens/CustomFeed";
import { DebugScreen } from "./view/screens/Debug";
import { DiscoverFeedsScreen } from "view/screens/DiscoverFeeds";
import { FeedsScreen } from "./view/screens/Feeds";
import { HomeScreen } from "./view/screens/Home";
import { JSX } from "react/jsx-runtime";
import { LogScreen } from "./view/screens/Log";
import { LoggedOut } from "view/com/auth/LoggedOut";
import { MissionsTab } from "view/screens/MissionsTab";
import { ModerationBlockedAccounts } from "view/screens/ModerationBlockedAccounts";
import { ModerationMuteListsScreen } from "./view/screens/ModerationMuteLists";
import { ModerationMutedAccounts } from "view/screens/ModerationMutedAccounts";
import { ModerationScreen } from "./view/screens/Moderation";
import { NotFoundScreen } from "./view/screens/NotFound";
import { NotificationsScreen } from "./view/screens/Notifications";
import { PostLikedByScreen } from "./view/screens/PostLikedBy";
import { PostRepostedByScreen } from "./view/screens/PostRepostedBy";
import { PostThreadScreen } from "./view/screens/PostThread";
import { PrivacyPolicyScreen } from "./view/screens/PrivacyPolicy";
import { ProfileFollowersScreen } from "./view/screens/ProfileFollowers";
import { ProfileFollowsScreen } from "./view/screens/ProfileFollows";
import { ProfileListScreen } from "./view/screens/ProfileList";
import { ProfileScreen } from "./view/screens/Profile";
import { RewardsScreen } from "view/screens/Rewards";
import { RewardsTab as RewardsTabScreen } from "view/screens/RewardsTab";
import { SavedFeeds } from "view/screens/SavedFeeds";
import { SearchScreen } from "./view/screens/Search";
import { SettingsScreen } from "./view/screens/Settings";
import { StyleSheet } from "react-native";
import { SupportScreen } from "./view/screens/Support";
import { TermsOfServiceScreen } from "./view/screens/TermsOfService";
import { Wallets } from "view/screens/Wallets";
import { bskyTitle } from "lib/strings/headings";
import { buildStateObject } from "lib/routes/helpers";
import { colors } from "lib/styles";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getRoutingInstrumentation } from "lib/sentry";
import { isNative } from "platform/detection";
import { observer } from "mobx-react-lite";
import { router } from "./routes";
import { useColorSchemeStyle } from "lib/hooks/useColorSchemeStyle";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "./state";

const navigationRef = createNavigationContainerRef<AllNavigatorParams>();

const HomeTab = createNativeStackNavigator<HomeTabNavigatorParams>();
const SearchTab = createNativeStackNavigator<SearchTabNavigatorParams>();
const FeedsTab = createNativeStackNavigator<FeedsTabNavigatorParams>();
const NotificationsTab =
  createNativeStackNavigator<NotificationsTabNavigatorParams>();
const MyProfileTab = createNativeStackNavigator<MyProfileTabNavigatorParams>();
const WalletsTab = createNativeStackNavigator<MyProfileTabNavigatorParams>();
const Flat = createNativeStackNavigator<FlatNavigatorParams>();
const Tab = createBottomTabNavigator<BottomTabNavigatorParams>();
const CommunitiesTab =
  createNativeStackNavigator<CommunitiesTabNavigatorParams>();
const RewardsTab = createNativeStackNavigator<RewardsTabNavigatorParams>();

/**
 * These "common screens" are reused across stacks.
 */
function commonScreens(Stack: typeof HomeTab, unreadCountLabel?: string) {
  const title = (page: string) => bskyTitle(page, unreadCountLabel);
  console.log("commonscreens", title, Stack);
  return (
    <>
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: title("Not Found") }}
      />
      <Stack.Screen
        name="Moderation"
        component={ModerationScreen}
        options={{ title: title("Moderation") }}
      />
      <Stack.Screen
        name="ModerationMuteLists"
        component={ModerationMuteListsScreen}
        options={{ title: title("Mute Lists") }}
      />
      <Stack.Screen
        name="ModerationMutedAccounts"
        component={ModerationMutedAccounts}
        options={{ title: title("Muted Accounts") }}
      />
      <Stack.Screen
        name="ModerationBlockedAccounts"
        component={ModerationBlockedAccounts}
        options={{ title: title("Blocked Accounts") }}
      />
      <Stack.Screen
        name="DiscoverFeeds"
        component={DiscoverFeedsScreen}
        options={{ title: title("Discover Feeds") }}
      />
      <Stack.Screen
        name="SignIn"
        component={LoggedOut}
        options={{ title: title("Sign In") }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: title("Settings") }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ route }) => ({ title: title(`@${route.params.name}`) })}
      />
      <Stack.Screen
        name="ProfileFollowers"
        component={ProfileFollowersScreen}
        options={({ route }) => ({
          title: title(`People following @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileFollows"
        component={ProfileFollowsScreen}
        options={({ route }) => ({
          title: title(`People followed by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="ProfileList"
        component={ProfileListScreen}
        options={{ title: title("Mute List") }}
      />
      <Stack.Screen
        name="PostThread"
        component={PostThreadScreen}
        options={({ route }) => ({
          title: title(`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostLikedBy"
        component={PostLikedByScreen}
        options={({ route }) => ({
          title: title(`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="PostRepostedBy"
        component={PostRepostedByScreen}
        options={({ route }) => ({
          title: title(`Post by @${route.params.name}`),
        })}
      />
      <Stack.Screen
        name="CustomFeed"
        component={CustomFeedScreen}
        options={{ title: title("Feed") }}
      />
      <Stack.Screen
        name="CommunityFeed"
        component={CommunityFeedScreen}
        options={{ title: title("Community") }}
      />
      <Stack.Screen
        name="CustomFeedLikedBy"
        component={CustomFeedLikedByScreen}
        options={{ title: title("Liked by") }}
      />
      <Stack.Screen
        name="Debug"
        component={DebugScreen}
        options={{ title: title("Debug") }}
      />
      <Stack.Screen
        name="Log"
        component={LogScreen}
        options={{ title: title("Log") }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: title("Support") }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: title("Privacy Policy") }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: title("Terms of Service") }}
      />
      <Stack.Screen
        name="CommunityGuidelines"
        component={CommunityGuidelinesScreen}
        options={{ title: title("Community Guidelines") }}
      />
      <Stack.Screen
        name="CopyrightPolicy"
        component={CopyrightPolicyScreen}
        options={{ title: title("Copyright Policy") }}
      />
      <Stack.Screen
        name="AppPasswords"
        component={AppPasswords}
        options={{ title: title("App Passwords") }}
      />
      <Stack.Screen
        name="SavedFeeds"
        component={SavedFeeds}
        options={{ title: title("Edit My Feeds") }}
      />
      <Stack.Screen
        name="RewardsTab"
        component={RewardsTabScreen}
        options={{ title: title("My Rewards") }}
      />
      <Stack.Screen
        name="MissionsTab"
        component={MissionsTab}
        options={{ title: title("My Reactions") }}
      />
      {/* <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ title: title("Rewards") }}
      /> */}
      <Stack.Screen
        name="Wallets"
        component={Wallets}
        options={{ title: title("Wallets") }}
      />
    </>
  );
}

/**
 * The TabsNavigator is used by native mobile to represent the routes
 * in 3 distinct tab-stacks with a different root screen on each.
 */
function TabsNavigator() {
  const tabBar = React.useCallback(
    (props: JSX.IntrinsicAttributes & BottomTabBarProps) => (
      <BottomBar {...props} />
    ),
    [],
  );
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false, lazy: true }}
      tabBar={tabBar}
    >
      <Tab.Screen name="HomeTab" component={HomeTabNavigator} />
      <Tab.Screen name="SearchTab" component={SearchTabNavigator} />
      <Tab.Screen name="FeedsTab" component={FeedsTabNavigator} />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsTabNavigator}
      />
      <Tab.Screen name="MyProfileTab" component={MyProfileTabNavigator} />
      <Tab.Screen name="CommunitiesTab" component={CommunitiesTabNavigator} />
      <Tab.Screen name="Rewards" component={RewardsTabNavigator} />
    </Tab.Navigator>
  );
}

function HomeTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  return (
    <HomeTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <HomeTab.Screen name="Home" component={HomeScreen} />
      {commonScreens(HomeTab)}
    </HomeTab.Navigator>
  );
}

function SearchTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  return (
    <SearchTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <SearchTab.Screen name="Search" component={SearchScreen} />
      {commonScreens(SearchTab as typeof HomeTab)}
    </SearchTab.Navigator>
  );
}

function FeedsTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  return (
    <FeedsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <FeedsTab.Screen name="Feeds" component={FeedsScreen} />
      {commonScreens(FeedsTab as typeof HomeTab)}
    </FeedsTab.Navigator>
  );
}

function NotificationsTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  return (
    <NotificationsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <NotificationsTab.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      {commonScreens(NotificationsTab as typeof HomeTab)}
    </NotificationsTab.Navigator>
  );
}

function CommunitiesTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  return (
    <CommunitiesTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <CommunitiesTab.Screen name="Communities" component={CommunitiesScreen} />
      {commonScreens(CommunitiesTab as typeof HomeTab)}
    </CommunitiesTab.Navigator>
  );
}

function RewardsTabNavigator() {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  return (
    <RewardsTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <RewardsTab.Screen name="Rewards" component={RewardsScreen} />
      {commonScreens(RewardsTab as typeof HomeTab)}
    </RewardsTab.Navigator>
  );
}

const MyProfileTabNavigator = observer(() => {
  const contentStyle = useColorSchemeStyle(styles.bgLight, styles.bgDark);
  const store = useStores();
  return (
    <MyProfileTab.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle,
      }}
    >
      <MyProfileTab.Screen
        name="MyProfile"
        // @ts-ignore // TODO: fix this broken type in ProfileScreen
        component={ProfileScreen}
        initialParams={{
          name: store.me.did,
          hideBackButton: true,
        }}
      />
      {commonScreens(MyProfileTab as typeof HomeTab)}
    </MyProfileTab.Navigator>
  );
});

/**
 * The FlatNavigator is used by Web to represent the routes
 * in a single ("flat") stack.
 */
const FlatNavigator = observer(() => {
  // console.log("FLAT NAV");
  const pal = usePalette("default");
  const unreadCountLabel = useStores().me.notifications.unreadCountLabel;
  const title = (page: string) => bskyTitle(page, unreadCountLabel);
  return (
    <Flat.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerShown: false,
        animationDuration: 250,
        contentStyle: [pal.view],
      }}
    >
      <Flat.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: title("Home") }}
      />
      <Flat.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: title("Search") }}
      />
      <Flat.Screen
        name="Feeds"
        component={FeedsScreen}
        options={{ title: title("Feeds") }}
      />
      <Flat.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: title("Notifications") }}
      />
      <Flat.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{ title: title("Communities") }}
      />
      <Flat.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ title: title("Rewards") }}
      />

      {commonScreens(Flat as typeof HomeTab, unreadCountLabel)}
    </Flat.Navigator>
  );
});

/**
 * The RoutesContainer should wrap all components which need access
 * to the navigation context.
 */

// TODO(viksit): change linking to right domain
const LINKING = {
  prefixes: ["bsky://", "https://v2.solarplex.xyz"],

  getPathFromState(state: State) {
    // console.log("state", state);
    // find the current node in the navigation tree
    let node = state.routes[state.index || 0];
    while (node.state?.routes && typeof node.state?.index === "number") {
      node = node.state?.routes[node.state?.index];
    }

    // build the path
    const route = router.matchName(node.name);
    if (typeof route === "undefined") {
      return "/"; // default to home
    }
    return route.build((node.params || {}) as RouteParams);
  },

  getStateFromPath(path: string) {
    // console.log("get state from path", path);
    const [name, params] = router.matchPath(path);
    if (isNative) {
      if (name === "Search") {
        return buildStateObject("SearchTab", "Search", params);
      }
      if (name === "Notifications") {
        return buildStateObject("NotificationsTab", "Notifications", params);
      }
      if (name === "Communities") {
        return buildStateObject("CommunitiesTab", "Communities", params);
      }
      if (name === "Rewards") {
        return buildStateObject("RewardsTab", "Rewards", params);
      }
      if (name === "Home") {
        return buildStateObject("HomeTab", "Home", params);
      }
      // if the path is something else, like a post, profile, or even settings, we need to initialize the home tab as pre-existing state otherwise the back button will not work
      return buildStateObject("HomeTab", name, params, [
        {
          name: "Home",
          params: {},
        },
      ]);
    } else {
      return buildStateObject("Flat", name, params);
    }
  },
};

function RoutesContainer({ children }: React.PropsWithChildren<{}>) {
  // console.log("routes container");
  const theme = useColorSchemeStyle(DefaultTheme, DarkTheme);
  return (
    <NavigationContainer
      ref={navigationRef}
      linking={LINKING}
      theme={theme}
      onReady={() => {
        // Register the navigation container with the Sentry instrumentation (only works on native)
        if (isNative) {
          const routingInstrumentation = getRoutingInstrumentation();
          routingInstrumentation.registerNavigationContainer(navigationRef);
        }
      }}
    >
      {children}
    </NavigationContainer>
  );
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
    // @ts-ignore I dont know what would make typescript happy but I have a life -prf
    navigationRef.navigate(name, params);
  }
}

function resetToTab(
  tabName:
    | "HomeTab"
    | "SearchTab"
    | "NotificationsTab"
    | "CommunitiesTab"
    | "RewardsTab",
) {
  if (navigationRef.isReady()) {
    navigate(tabName);
    if (navigationRef.canGoBack()) {
      navigationRef.dispatch(StackActions.popToTop()); //we need to check .canGoBack() before calling it
    }
  }
}

function reset() {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: isNative ? "HomeTab" : "Home" }],
      }),
    );
  }
}

function handleLink(url: string) {
  let path;
  if (url.startsWith("/")) {
    path = url;
  } else if (url.startsWith("http")) {
    try {
      path = new URL(url).pathname;
    } catch (e) {
      console.error("Invalid url", url, e);
      return;
    }
  } else {
    console.error("Invalid url", url);
    return;
  }

  const [name, params] = router.matchPath(path);
  if (isNative) {
    if (name === "Search") {
      resetToTab("SearchTab");
    } else if (name === "Notifications") {
      resetToTab("NotificationsTab");
    } else if (name === "Communities") {
      resetToTab("CommunitiesTab");
    } else if (name === "Rewards") {
      resetToTab("RewardsTab");
    } else {
      resetToTab("HomeTab");
      // @ts-ignore matchPath doesnt give us type-checked output -prf
      navigate(name, params);
    }
  } else {
    // @ts-ignore matchPath doesnt give us type-checked output -prf
    navigate(name, params);
  }
}

const styles = StyleSheet.create({
  bgDark: {
    backgroundColor: colors.black,
  },
  bgLight: {
    backgroundColor: colors.white,
  },
});

export {
  navigate,
  resetToTab,
  reset,
  handleLink,
  TabsNavigator,
  FlatNavigator,
  RoutesContainer,
};
