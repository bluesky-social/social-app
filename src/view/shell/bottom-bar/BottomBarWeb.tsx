import * as fa from "@fortawesome/free-solid-svg-icons";

import {
  BellIcon,
  BellIconSolid,
  CommunitiesIcon,
  CommunitiesIconSolid,
  GiftIcon,
  GiftIconFilled,
  HomeIcon,
  HomeIconSolid,
  UserIcon,
} from "lib/icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import { getCurrentRoute, isTab } from "lib/routes/helpers";

import { Animated } from "react-native";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Link } from "view/com/util/Link";
import React from "react";
import { clamp } from "lib/numbers";
import { observer } from "mobx-react-lite";
import { styles } from "./BottomBarStyles";
import { useMinimalShellMode } from "lib/hooks/useMinimalShellMode";
import { useNavigationState } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStores } from "state/index";

export const BottomBarWeb = observer(() => {
  const store = useStores();
  const pal = usePalette("default");
  const safeAreaInsets = useSafeAreaInsets();
  const { footerMinimalShellTransform } = useMinimalShellMode();

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        pal.view,
        pal.border,
        { paddingBottom: clamp(safeAreaInsets.bottom, 15, 30) },
        footerMinimalShellTransform,
      ]}
    >
      <NavItem routeName="Feed" href="/">
        {({ isActive }) => {
          const Icon = isActive ? HomeIconSolid : HomeIcon;
          return (
            <Icon
              strokeWidth={4}
              size={24}
              style={[styles.ctrlIcon, pal.text, styles.homeIcon]}
            />
          );
        }}
      </NavItem>
      <NavItem routeName="Notifications" href="/notifications">
        {({ isActive }) => {
          const Icon = isActive ? BellIconSolid : BellIcon;
          return (
            <Icon
              size={24}
              strokeWidth={1.9}
              style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
            />
          );
        }}
      </NavItem>

      <NavItem routeName="Communities" href="/communities">
        {({ isActive }) => {
          const Icon = isActive ? CommunitiesIconSolid : CommunitiesIcon;
          return (
            <Icon
              size={24}
              strokeWidth={1.9}
              style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
            />
          );
        }}
      </NavItem>
      <NavItem routeName="Rewards" href="/rewards">
        {({ isActive }) => {
          const Icon = isActive ? GiftIconFilled : GiftIcon;
          return (
            <Icon
              size={24}
              strokeWidth={1.9}
              style={[styles.ctrlIcon, pal.text, styles.bellIcon]}
            />
          );
        }}
      </NavItem>

      {/* <NavItem routeName="Profile" href={`/profile/${store.me.handle}`}>
        {() => (
          <UserIcon
            size={28}
            strokeWidth={1.5}
            style={[styles.ctrlIcon, pal.text, styles.profileIcon]}
          />
        )}
      </NavItem> */}
    </Animated.View>
  );
});

const NavItem: React.FC<{
  children: (props: { isActive: boolean }) => React.ReactChild;
  href: string;
  routeName: string;
}> = ({ children, href, routeName }) => {
  const currentRoute = useNavigationState(getCurrentRoute);
  const isActive = isTab(currentRoute.name, routeName);
  return (
    <Link href={href} style={styles.ctrl}>
      {children({ isActive })}
    </Link>
  );
};
