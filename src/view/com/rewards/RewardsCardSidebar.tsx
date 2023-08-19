import * as Toast from "view/com/util/Toast";

import { StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { ClaimBtn } from "./ClaimBtn";
import { Day } from "./Day";
import { NavigationProp } from "lib/routes/types";
import React from "react";
import { Text } from "../util/text/Text";
import { TouchableOpacity } from "react-native-gesture-handler";
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
  const dailyProgress = store.rewards.dailyProgress(userId);
  const weeklyProgress = store.rewards.weeklyProgress(userId);

  const shouldClaimDaily = store.rewards.shouldClaimDaily(userId);
  const isClaimingDaily = store.rewards.isClaimingDaily(userId);
  const hasClaimedDaily = store.rewards.hasClaimedDaily(userId);
  const dailyReward = store.rewards.dailyReward(userId);
  const hasClaimedWeekly = store.rewards.hasClaimedWeekly(userId);
  const shouldClaimWeekly = store.rewards.shouldClaimWeekly(userId);

  useFocusEffect(
    React.useCallback(() => {
      screen("Rewards");

      if (userId !== "") {
        store.rewards.fetchMissions(userId);
      }
    }, [store, screen]),
  );

  const onClaimHandler = async () => {
    if (!store.session.hasSession) {
      navigation.navigate("SignIn");
    } else if (shouldClaimDaily || shouldClaimWeekly) {
      navigation.navigate("Missions");
    } else {
      navigation.navigate("Home");
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
                {dailyProgress.count ?? 0}
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
          {(shouldClaimWeekly || shouldClaimDaily) && (
              <TouchableOpacity
                style={styles.ClaimCTA}
                onPress={onClaimHandler}
              >
                <Text style={styles.claimTextCTA}>
                  {!store.session.hasSession
                    ? "Sign In"
                    : shouldClaimDaily
                    ? "Claim Daily Reward"
                    : shouldClaimWeekly && !hasClaimedWeekly
                    ? "Claim Weekly Reward"
                    : "Keep Going!"}
                </Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  ClaimCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: colors.splx.primary[50],
    marginTop: 4,
    marginBottom: 4,
  },
  claimTextCTA: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
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
