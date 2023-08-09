import * as Toast from "view/com/util/Toast";

import { StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { ClaimBtn } from "./ClaimBtn";
import { Day } from "./Day";
import { NavigationProp } from "lib/routes/types";
import React from "react";
import { Text } from "../util/text/Text";
import { colors } from "lib/styles";
import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import { useAnalytics } from "lib/analytics/analytics";
import { usePalette } from "lib/hooks/usePalette";
import { useState } from "react";
import { useStores } from "state/index";

export const RewardsCardSidebar = observer(({ userId }: { userId: string }) => {
  const store = useStores();
  const { screen } = useAnalytics();

  const pal = usePalette("default");
  const navigation = useNavigation<NavigationProp>();
  const shouldClaimDaily = store.rewards.shouldClaimDaily(userId);
  const dailyPogress = store.rewards.dailyProgress(userId);
  const weeklyProgress = store.rewards.weeklyProgress(userId);

  useFocusEffect(
    React.useCallback(() => {
      screen("Rewards");

      if (userId !== "") {
        store.rewards.fetchMissions(userId);
      }
    }, [store, screen]),
  );

  const onClaimHandler = async () => {
    if (store.session.hasSession) {
      navigation.navigate("SignIn");
    } else {
      navigation.navigate("Rewards");
    }
  };

  return (
    <View style={styles.outer}>
      <View style={[styles.streaks, pal.border]}>
        <Text type="2xl-heavy" style={styles.textPadding}>
          Daily Streaks
        </Text>

        <Text type="md-medium" style={[styles.textPadding]}>
          Create / engage with community posts to start a streak and win
          reactions!
        </Text>
        <View style={styles.horizontalBox}>
          <View style={styles.streaksContainerBox}>
            <Text
              type="sm-thin"
              style={{ color: colors.gray4, paddingBottom: 4 }}
            >
              POINTS
            </Text>
            <View>
              <Text type="lg-bold" style={styles.textPadding}>
                {dailyPogress.count ?? 0}
                <Text type="xs-heavy" style={{ color: colors.gray4 }}>
                  /50
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.streaksContainerBox}>
            <Text
              type="sm-thin"
              style={{
                color: colors.gray4,
                paddingBottom: 4,
                textAlign: "center",
                textAlignVertical: "bottom",
              }}
            >
              DAYS
            </Text>
            <View style={styles.horizontalBox}>
              {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => {
                return (
                  <Day
                    key={idx}
                    day={day}
                    isCompleted={day <= weeklyProgress.count}
                  />
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.claimBtn}>
          <ClaimBtn
            text={store.session.hasSession ? "Claim Reward" : "Get Started"}
            onClick={onClaimHandler}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  claimBtn: {
    paddingTop: 10,
  },
  outer: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  streaks: {
    flexDirection: "column",
    borderRadius: 8,

    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  textPadding: {
    paddingBottom: 4,
    textAlign: "left",
  },
  para: {
    fontSize: 16,
    paddingTop: 4,
    textTransform: "capitalize",
  },
  streaksContainerBox: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingRight: 8,
  },

  streaksText: {
    fontWeight: "600",
    fontSize: 18,
  },
  horizontalBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  dailyPoints: {
    fontWeight: "800",
    fontSize: 24,
    color: colors.splx.primary[50],
    // textAlign: "center",
  },
});
