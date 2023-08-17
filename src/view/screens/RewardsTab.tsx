import { colors, s } from "lib/styles";

import { CenteredView } from "view/com/util/Views.web";
import { CommonNavigatorParams } from "lib/routes/types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { RewardsCard } from "view/com/rewards/RewardsCard";
import { StyleSheet } from "react-native";
import { Text } from "view/com/util/text/Text";
import { ViewHeader } from "view/com/util/ViewHeader";
import { observer } from "mobx-react-lite";
import { useStores } from "state/index";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

// TODO: change the props text over here
// type Props = NativeStackScreenProps<CommonNavigatorParams, "Missions">;
export const RewardsTab = withAuthRequired(
  observer(() => {
    const store = useStores();
    const did = store.session?.currentSession?.did ?? "";

    return (
      <CenteredView style={[s.hContentRegion, styles.container]}>
        <ViewHeader title="Missions" canGoBack={false} />
        <RewardsCard userId={did} />
      </CenteredView>
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
