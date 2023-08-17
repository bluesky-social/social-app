import { Button, StyleSheet, View } from "react-native";
import React, { useState } from "react";
import { colors, s } from "lib/styles";

import { CenteredView } from "view/com/util/Views.web";
import { CommonNavigatorParams } from "lib/routes/types";
import { FeedsTabBar } from "view/com/pager/FeedsTabBarMobile";
import { MissionsTab } from "./MissionsTab";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationProp } from "lib/routes/types";
import { RewardsTab } from "./RewardsTab";
import { Selector } from "view/com/util/ViewSelector";
import { Text } from "view/com/util/text/Text";
import { ViewHeader } from "view/com/util/ViewHeader";
import { clamp } from "lib/numbers";
import { isMobileWeb } from "platform/detection";
import { navigate } from "../../Navigation";
import { observer } from "mobx-react-lite";
import { useNavigation } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

const tabs = [
  {
    tabName: "Missions",
    navName: "MissionsTab",
  },
  {
    tabName: "Rewards",
    navName: "RewardsTab",
  },
];

// TODO: change the props text over here
type Props = NativeStackScreenProps<CommonNavigatorParams, "Reactions">;
export const RewardsScreen = withAuthRequired(
  observer(({ route }: Props) => {
    const navigation = useNavigation<NavigationProp>();
    const pal = usePalette("default");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const store = useStores();

    const onPressSelection = React.useCallback(
      (index: number) => {
        setSelectedIndex(clamp(index, 0, tabs.length));
      },
      [setSelectedIndex, tabs],
    );

    return (
      <View style={[s.hContentRegion]}>
        <CenteredView
          style={[
            s.hContentRegion,
            styles.container,
            // { alignItems: isMobileWeb ? "center" : "flex-start" },
          ]}
        >
          <ViewHeader title="Rewards" canGoBack={false} />
          <View
            style={[
              styles.selectorContainer,
              { alignItems: isMobileWeb ? "center" : "flex-start" },
            ]}
          >
            <Selector
              items={tabs.map((t) => t.tabName)}
              selectedIndex={selectedIndex}
              onSelect={onPressSelection}
            />
          </View>
          {selectedIndex === 0 ? <RewardsTab /> : <MissionsTab />}
        </CenteredView>
      </View>
    );
  }),
);

const styles = StyleSheet.create({
  container: {
    borderLeftColor: colors.gray1,
    borderLeftWidth: 1,
    borderRightColor: colors.gray1,
    borderRightWidth: 1,
    flexDirection: "column",
  },
  selectorContainer: {
    flexDirection: "column",
  },
});
