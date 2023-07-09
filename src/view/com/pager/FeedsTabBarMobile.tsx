import {
  Animated,
  Button,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ComposeIcon2, HeartIcon, SolarplexLogo } from "lib/icons";
import React, { useMemo } from "react";
import { gradients, s } from "lib/styles";

import { FAB } from "../util/fab/FAB";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import LinearGradient from "react-native-linear-gradient";
import { RenderTabBarFnProps } from "view/com/pager/Pager";
import { TabBar } from "view/com/pager/TabBar";
import { Text } from "../util/text/Text";
import { UserAvatar } from "view/com/util/UserAvatar";
import { observer } from "mobx-react-lite";
import { useAnimatedValue } from "lib/hooks/useAnimatedValue";
import { useColorSchemeStyle } from "lib/hooks/useColorSchemeStyle";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";

export const FeedsTabBar = observer(
  (
    props: RenderTabBarFnProps & {
      testID?: string;
      onPressSelected: () => void;
    },
  ) => {
    const store = useStores();
    const pal = usePalette("default");
    const interp = useAnimatedValue(0);

    React.useEffect(() => {
      Animated.timing(interp, {
        toValue: store.shell.minimalShellMode ? 1 : 0,
        duration: 100,
        useNativeDriver: true,
        isInteraction: false,
      }).start();
    }, [interp, store.shell.minimalShellMode]);
    const transform = {
      transform: [{ translateY: Animated.multiply(interp, -140) }],
    };

    const brandBlue = useColorSchemeStyle(s.brandBlue, s.blue3);

    const onPressAvi = React.useCallback(() => {
      store.shell.openDrawer();
    }, [store]);

    const items = useMemo(
      () => ["Home", ...store.me.savedFeeds.pinnedFeedNames],
      [store.me.savedFeeds.pinnedFeedNames],
    );
    const onPressCompose = React.useCallback(() => {
      store.shell.openComposer({});
    }, [store]);

    return (
      <Animated.View style={[pal.view, pal.border, styles.tabBar, transform]}>
        <View style={[pal.view, styles.topBar]}>
          <View style={[pal.view]}>
            <TouchableOpacity
              testID="viewHeaderDrawerBtn"
              onPress={onPressAvi}
              accessibilityRole="button"
              accessibilityLabel="Open navigation"
              accessibilityHint="Access profile and other navigation links"
              hitSlop={10}
            >
              <UserAvatar avatar={store.me.avatar} size={27} />
              {/* <FontAwesomeIcon
                icon="bars"
                size={18}
                color={pal.colors.textLight}
              /> */}
            </TouchableOpacity>
          </View>
          <View style={[pal.view]}>
            <TouchableOpacity
              testID="viewHeaderComposeBtn"
              // style={[styles.btn, styles.primaryBtn]}
              onPress={onPressCompose}
              accessibilityRole="button"
              accessibilityLabel="Compose post"
              accessibilityHint="Compose a post"
              hitSlop={10}
            >
              <LinearGradient
                colors={[gradients.purple.start, gradients.purple.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.postBtn}
              >
                <Text style={[s.white, s.f16, s.bold]}>{"Post"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        <TabBar
          key={items.join(",")}
          {...props}
          items={items}
          indicatorColor={pal.colors.link}
        />
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "column",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 2,
    width: "100%",
  },
  title: {
    fontSize: 21,
  },
  primaryBtn: {
    backgroundColor: gradients.purple.start,
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  mainBtn: {
    paddingHorizontal: 24,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
  },
  postBtn: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
});
