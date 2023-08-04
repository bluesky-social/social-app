import { CenteredView } from "view/com/util/Views.web";
import { CommonNavigatorParams } from "lib/routes/types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { RewardsCard } from "view/com/rewards/RewardsCard";
import { Text } from "view/com/util/text/Text";
import { observer } from "mobx-react-lite";
import { useStores } from "state/index";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

// TODO: change the props text over here
// type Props = NativeStackScreenProps<CommonNavigatorParams, "RewardsTab">;
export const RewardsTab = withAuthRequired(
  observer(() => {
    const store = useStores();
    const did = store.session?.currentSession?.did ?? "";

    return (
      <CenteredView>
        <RewardsCard userId={did} />
      </CenteredView>
    );
  }),
);
