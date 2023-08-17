import * as Toast from "view/com/util/Toast";

import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { ClaimBtn } from "./ClaimBtn";
import { Day } from "./Day";
import { NavigationProp } from "lib/routes/types";
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
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type RewardClaimedProps = {
  rewardsImg: string;
  userId: string;
  isWeekly?: boolean;
};

const RewardClaimed = ({
  rewardsImg,
  userId,
  isWeekly = false,
}: RewardClaimedProps) => {
  const pal = usePalette("default");
  const store = useStores();
  const hasClaimedWeekly = store.rewards.hasClaimedWeekly(userId);
  const shouldClaimWeekly = store.rewards.shouldClaimWeekly(userId);
  const [displayWeekly, setDisplayWeekly] = useState<boolean>(false);

  const onPressCompose = React.useCallback(() => {
    store.shell.openComposer({
      isSharing: true,
      uri: rewardsImg,
      sharingText: isWeekly
        ? "Just got my reward from my Weekly Streak!"
        : "Freshly Minted!",
    });
  }, [store]);

  return (
    <View>
      {displayWeekly ? (
        <WeeklyScreen userId={userId} />
      ) : (
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
            resizeMode="contain"
            style={styles.rewardImage}
          />
          <View style={styles.buttonGroup}>
            {shouldClaimWeekly && !hasClaimedWeekly ? (
              <View style={{ paddingHorizontal: 10 }}>
                <ClaimBtn
                  text="Claim Weekly Reward"
                  weekly={true}
                  onClick={() => setDisplayWeekly(true)}
                />
              </View>
            ) : (
              <View style={styles.RollBtn}>
                <ClaimBtn text="Share" onClick={onPressCompose} />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const WeeklyScreen = ({ userId }: { userId: string }) => {
  const pal = usePalette("default");
  const store = useStores();
  const hasClaimedWeekly = store.rewards.hasClaimedWeekly(userId);
  const shouldClaimWeekly = store.rewards.shouldClaimWeekly(userId);
  const isClaimingWeekly = store.rewards.isClaimingWeekly(userId);
  const weeklyReward = store.rewards.weeklyReward(userId);
  const { setVisible } = useWalletModal();

  const onClaimWeeklyHandler = async () => {
    if (!store.me.splxWallet) {
      setVisible(true);
      return;
    }
    await store.rewards.claimWeeklyReward(userId);

    store.me.nft.fetchNfts(store.me.splxWallet);
  };
  return (
    <View>
      {weeklyReward ? (
        <RewardClaimed
          isWeekly={true}
          userId={userId}
          rewardsImg={
            weeklyReward?.image ?? "https://i.ibb.co/RB3bMLt/blob.png"
          }
        />
      ) : (
        <View style={styles.DiceRowCol}>
          <Text type="2xl-bold" style={[pal.text, styles.DiceRollText]}>
            Claim Your Weekly
          </Text>
          <Image
            source={
              hasClaimedWeekly
                ? require("../../../../assets/ChestOpening.gif")
                : require("../../../../assets/ChestClosed.png")
            }
            style={styles.DiceRollImage}
          />
          <View style={[styles.RollBtn]}>
            <ClaimBtn
              weekly={true}
              done={hasClaimedWeekly}
              disabled={!shouldClaimWeekly || hasClaimedWeekly}
              loading={isClaimingWeekly}
              text={
                isClaimingWeekly
                  ? "Claiming..."
                  : hasClaimedWeekly
                  ? "Check your wallet!"
                  : !store.me.splxWallet
                  ? "Connect Wallet"
                  : "Open"
              }
              onClick={onClaimWeeklyHandler}
            />
          </View>
        </View>
      )}
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

export const RewardsCard = observer(function RewardsCard({
  userId,
}: {
  userId: string;
}) {
  const store = useStores();
  const { screen } = useAnalytics();
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
  const hasClaimedDaily = store.rewards.hasClaimedDaily(userId);
  const dailyReward = store.rewards.dailyReward(userId);
  const dailyPogress = store.rewards.dailyProgress(userId);
  const weeklyProgress = store.rewards.weeklyProgress(userId);
  const hasClaimedWeekly = store.rewards.hasClaimedWeekly(userId);
  const shouldClaimWeekly = store.rewards.shouldClaimWeekly(userId);
  const [displayWeekly, setDisplayWeekly] = useState<boolean>(false);

  const shouldShowDiceCompnent = showDiceComponent || !dailyReward;
  const { setVisible } = useWalletModal();
  const wallet = useWallet();
  const { track } = useAnalytics();

  const onClaimDailyHandler = async () => {
    if (!store.me.splxWallet) {
      setVisible(true);
      return;
    }
    await store.rewards.claimDailyReward(userId);

    store.me.nft.fetchNfts(store.me.splxWallet);
  };

  useEffect(() => {
    async function setWallet() {
      if (!store.me.splxWallet && wallet !== undefined && wallet.publicKey) {
        await store.me.connectWallet(wallet.publicKey?.toString());
      }
    }
    setWallet();
  }, [wallet]);

  const onDiceRollHandler = () => {
    if (!store.session.hasSession) {
      navigation.navigate("SignIn");
    } else if (shouldClaimDaily) {
      setDiceComponent(true);
    } else {
      navigation.navigate("Home");
    }
  };

  const DiceRoll = () => {
    const pal = usePalette("default");
    return (
      <View>
        {dailyReward ? (
          <RewardClaimed
            userId={userId}
            rewardsImg={
              dailyReward?.image ?? "https://i.ibb.co/RB3bMLt/blob.png"
            }
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
                done={hasClaimedDaily}
                disabled={!shouldClaimDaily || hasClaimedDaily}
                loading={isClaimingDaily}
                text={
                  isClaimingDaily
                    ? "Claiming..."
                    : hasClaimedDaily
                    ? "Check your wallet!"
                    : "Roll"
                }
                onClick={onClaimDailyHandler}
              />
            </View>
            <View style={{ marginVertical: 4 }}>
              {shouldClaimWeekly && !hasClaimedWeekly && (
                <Text style={[pal.text]} type="lg-heavy">
                  You are Eligible to Claim your Weekly Reward.
                </Text>
              )}
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
        <View>
          {displayWeekly ? (
            <WeeklyScreen userId={userId} />
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
                    <View>
                      {shouldClaimDaily && !hasClaimedDaily ? (
                        <ClaimBtn
                          text={
                            !store.session.hasSession
                              ? "Sign In"
                              : hasClaimedDaily
                              ? "Check your wallet!"
                              : shouldClaimDaily
                              ? "Claim Reward"
                              : isClaimingDaily
                              ? "Claiming..."
                              : dailyPogress
                              ? "Keep Going!"
                              : "Like Or Post Something"
                          }
                          done={hasClaimedDaily}
                          disabled={!shouldClaimDaily || hasClaimedDaily}
                          loading={isClaimingDaily}
                          onClick={onDiceRollHandler}
                        />
                      ) : shouldClaimWeekly && !hasClaimedWeekly ? (
                        <ClaimBtn
                          text="Claim Weekly Reward"
                          weekly={true}
                          onClick={() => setDisplayWeekly(true)}
                        />
                      ) : (
                        <ClaimBtn
                          text="Keep Going!"
                          onClick={() => navigation.navigate("Home")}
                        />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
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
  rewardImage: {
    width: 250,
    height: 250,
  },
});
