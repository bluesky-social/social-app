import {
  CommonNavigatorParams,
  NativeStackScreenProps,
} from "lib/routes/types";

import React from "react";
import { ScrollView } from "view/com/util/Views";
import { Text } from "view/com/util/text/Text";
import { TextLink } from "view/com/util/Link";
import { View } from "react-native";
import { ViewHeader } from "../com/util/ViewHeader";
import { s } from "lib/styles";
import { useFocusEffect } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";

type Props = NativeStackScreenProps<CommonNavigatorParams, "PrivacyPolicy">;
export const PrivacyPolicyScreen = (_props: Props) => {
  const pal = usePalette("default");
  const store = useStores();

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false);
    }, [store]),
  );

  return (
    <View>
      <ViewHeader title="Privacy Policy" />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text style={pal.text}>
            The Privacy Policy has been moved to{" "}
            <TextLink
              style={pal.link}
              href="https://usedispatch.notion.site/Terms-d0b533a2a7f04c0eaea58440dbea5896?pvs=4"
              text="solarplex.xyz"
            />
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  );
};
