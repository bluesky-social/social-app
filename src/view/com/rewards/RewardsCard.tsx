import * as Toast from "view/com/util/Toast";

import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { ClaimBtn } from "./ClaimBtn";
import { Day } from "./Day";
import { NavigationProp } from "lib/routes/types";
import React from "react";
import { Text } from "../util/text/Text";
import { colors } from "lib/styles";
import { isMobileWeb } from "platform/detection";
import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useAnalytics } from "lib/analytics/analytics";
import { usePalette } from "lib/hooks/usePalette";
import { useState } from "react";
import { useStores } from "state/index";

type RewardClaimedProps = {
  rewardsImg: string;
};

const RewardClaimed = ({ rewardsImg }: RewardClaimedProps) => {
  const pal = usePalette("default");
  const store = useStores();
  console.log("rewardsImg", rewardsImg);
  const onPressCompose = React.useCallback(() => {
    store.shell.openComposer({
      isSharing: true,
    });
  }, [store]);

  const opts = store.shell.composerOpts;
  console.log("opts", opts);
  return (
    <View style={styles.DiceRowCol}>
      <Text type="lg-thin">🎉Congrats!🎉</Text>
      <Text type="2xl-bold" style={[pal.text, styles.DiceRollText]}>
        You won a Reward!
      </Text>
      <Image
        source={{
          uri: rewardsImg,
        }}
        accessible={true}
        accessibilityLabel={"reward image"}
        accessibilityHint=""
        style={styles.DiceRollImage}
      />
      <View style={styles.RollBtn}>
        <ClaimBtn text="Share" onClick={onPressCompose} />
      </View>
    </View>
  );
};
export interface claimRewardRes {
  claimed: boolean;
  reward?: {
    image: string;
    name: string;
    description: string;
    attributes: any;
  };
}

export const RewardsCard = observer(({ userId }: { userId: string }) => {
  const store = useStores();
  const { screen } = useAnalytics();
  const pal = usePalette("default");
  const navigation = useNavigation<NavigationProp>();
  const [showDiceComponent, setDiceComponent] = useState<boolean>(false);

  useFocusEffect(
    React.useCallback(() => {
      screen("Rewards");

      if (userId !== "") {
        store.rewards.fetchMissions(userId);
      }
    }, [store, screen]),
  );

  const shouldClaimDaily = store.rewards.shouldClaimDaily(userId);
  const isClaimingDaily = store.rewards.isClaimingDaily(userId);
  const dailyReward = store.rewards.dailyReward(userId);
  const isClaimDailyBusy =
    !!dailyReward || !shouldClaimDaily || isClaimingDaily;

  const dailyPogress = store.rewards.dailyProgress(userId);
  const weeklyProgress = store.rewards.weeklyProgress(userId);

  const shouldShowDiceCompnent = showDiceComponent || isClaimDailyBusy;

  const onClaimHandler = async () => {
    await store.rewards.claimDailyReward(userId);
  };

  const onDiceRollHandler = () => {
    if (store.session.hasSession) {
      navigation.navigate("SignIn");
    } else {
      setDiceComponent(true);
    }
  };

  const DiceRoll = () => {
    const pal = usePalette("default");
    return (
      <View>
        {dailyReward ? (
          <RewardClaimed
            rewardsImg={dailyReward?.image ?? "https://picsum.photos/300/300"}
          />
        ) : (
          <View style={styles.DiceRowCol}>
            <Text type="lg-thin">You’ve completed a milestone!</Text>
            <Text type="2xl-bold" style={[pal.text, styles.DiceRollText]}>
              Roll for your reward!
            </Text>
            <Image
              source={require("../../../../assets/reactions/dice.gif")}
              style={styles.DiceRollImage}
            />
            <View style={[styles.RollBtn]}>
              <ClaimBtn
                loading={isClaimingDaily}
                text="Roll"
                onClick={onClaimHandler}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.outer, s.h100pct]}>
      {showDiceComponent ? (
        <DiceRoll />
      ) : (
        <View style={styles.dailyContainer}>
          <View style={styles.leftgroup}>
            <View style={styles.imageContainer}>
              <Image
                style={styles.fireImage}
                source={require("../../../../assets/fire.png")}
              />
            </View>
          </View>
          <View style={[styles.streaks]}>
            <Text type="2xl-heavy" style={styles.textPadding}>
              Daily Streaks
            </Text>
            <Text
              type="md-medium"
              style={[styles.textPadding, { paddingVertical: 8, flex: 1 }]}
            >
              Create / engage with community posts to start a streak and win
              reactions!
            </Text>
            <View style={styles.dataContainer}>
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
                      {dailyPogress?.count ?? 0}
                      <Text type="xs-heavy" style={{ color: colors.gray4 }}>
                        /100
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
                          isCompleted={day <= (weeklyProgress.count || -1)}
                        />
                      );
                    })}
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.claimBtnContainer,
                  { paddingVertical: isMobileWeb ? 8 : 0 },
                ]}
              >
                <ClaimBtn
                  text={
                    store.session.hasSession ? "Claim Reward" : "Get Started"
                  }
                  loading={!shouldClaimDaily}
                  onClick={onDiceRollHandler}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  leftgroup: {
    paddingVertical: 10,
  },
  claimBtnContainer: {
    flexShrink: 1,
  },
  dataContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    width: "100%",
  },
  imageContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 1000,
    padding: 15,
    backgroundColor: s.gray3.color,
  },
  fireImage: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },
  dailyContainer: {
    flexDirection: "row",
  },
  outer: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,

    borderBottomColor: colors.gray2,
  },
  streaks: {
    flexDirection: "column",
    paddingHorizontal: 14,
    flexShrink: 1,
    paddingVertical: 10,
  },
  paraTextPadding: {
    paddingBottom: 4,
    textAlign: "left",
  },
  textPadding: {
    paddingBottom: 4,
    width: "100%",
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
  DiceRowCol: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.gray1,
    borderWidth: 1,

    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  DiceRollText: {
    paddingVertical: 6,
  },
  RollBtn: {
    width: 200,
    paddingVertical: 4,
  },
  DiceRollImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
});
