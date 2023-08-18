import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { ClaimBtn } from "./ClaimBtn";
import { Day } from "./Day";
import { NavigationProp } from "lib/routes/types";
import { Text } from "../util/text/Text";
import { colors } from "lib/styles";
import { isMobileWeb } from "platform/detection";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useAnalytics } from "lib/analytics/analytics";
import { usePalette } from "lib/hooks/usePalette";
import { useSplxWallet } from '../wallet/useSplxWallet';
import { useState } from "react";
import { useStores } from "state/index";

interface RewardClaimedProps {
  rewardsImg: string;
  userId: string;
  isWeekly?: boolean;
};

interface UserRewardProps {
  userId: string;
  setDisplayWeekly: React.Dispatch<React.SetStateAction<boolean>>;
}

interface StartUserRewardProps extends UserRewardProps {
  setDisplayDaily: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UserClaimProps extends UserRewardProps {
  source: ImageSourcePropType;
  isWeekly?: boolean;
}

function ClaimWeeklyButton({ setDisplayWeekly }: UserRewardProps) {
  return (
    <View style={{ paddingHorizontal: 10 }}>
      <ClaimBtn
        text="Claim Weekly Reward"
        weekly={true}
        onClick={() => setDisplayWeekly(true)}
      />
    </View>
  )
}

function ShareButton({ rewardsImg, isWeekly}: RewardClaimedProps) {
  const store = useStores();
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
    <View style={styles.RollBtn}>
      <ClaimBtn text="Share" onClick={onPressCompose} />
    </View>
  )
}

function RewardClaimedImage({ rewardsImg }: RewardClaimedProps) {
  const pal = usePalette("default");
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
        resizeMode="contain"
        style={styles.rewardImage}
      />
    </View>
  )
}

function PostRewardClaimedButton({ userId, setDisplayWeekly }: UserRewardProps) {
  const store = useStores();
  const shouldClaimWeekly = store.rewards.shouldClaimWeekly(userId);
  const weeklyReward = store.rewards.weeklyReward(userId);
  const dailyReward = store.rewards.dailyReward(userId);
  return (
    <View style={styles.buttonGroup}>
        { shouldClaimWeekly && !weeklyReward ? (
          <ClaimWeeklyButton userId={ userId } setDisplayWeekly={ setDisplayWeekly }></ClaimWeeklyButton>
        ) : weeklyReward ? (
          <ShareButton isWeekly={true} userId={ userId } rewardsImg={ weeklyReward.image } ></ShareButton>
        ) : dailyReward ? (
          <ShareButton isWeekly={false} userId={ userId } rewardsImg={ dailyReward.image }></ShareButton>
        ): (
          <span>never</span>
        )}
    </View>
  );
}

const RewardClaimButton = observer(function RewardClaimButton({ userId, isWeekly }: { userId: string, isWeekly: boolean}) {
  const store = useStores();
  const [visible, setVisible, linkedWallet, walletAddressFromWalletConnect, connectWalletIsBusy, disconnectWalletIsBusy] = useSplxWallet();
  const isDone = isWeekly ? store.rewards.hasClaimedWeekly(userId) : store.rewards.hasClaimedDaily(userId);
  const shouldClaim = isWeekly ? store.rewards.shouldClaimWeekly(userId) : store.rewards.shouldClaimDaily(userId);
  const isClaiming = isWeekly ? store.rewards.isClaimingWeekly(userId) : store.rewards.isClaimingDaily(userId);
  const defalultText = isWeekly ? 'Open' : 'Roll';
  const [linkingWallet, setLinkingWallet] = useState<boolean>(false);
  const text = isClaiming 
    ? 'Claiming...'
    : isDone
    ? 'Check your wallet!'
    : linkingWallet
    ? 'Connecting...'
    : !linkedWallet
    ? 'Connect Wallet'
    : defalultText;
  
  const { track } = useAnalytics();

  useEffect(() => {
    if (linkedWallet && linkingWallet) {
      setLinkingWallet(false);
      void claimHandler();
    }
  }, [linkedWallet]);

  useEffect(() => {
    if (!connectWalletIsBusy && linkingWallet) {
      setLinkingWallet(false);
    }
  }, [connectWalletIsBusy]);

  const claimHandler = async () => {
    if (linkingWallet) {
      return;
    }
    if (!linkedWallet) {
      setLinkingWallet(true);
      if (walletAddressFromWalletConnect) {
        void store.wallet.linkWallet(walletAddressFromWalletConnect);
      } else {
        setVisible(true);
      }
      return;
    }
    if (isWeekly) {
      await store.rewards.claimWeeklyReward(userId);
      track("Claim:WeeklyReward");
    } else {
      await store.rewards.claimDailyReward(userId);
      track("Claim:DailyReward");
    }
    // This won't work b/c we need to do this from the store.
    store.me.nft.fetchNfts(linkedWallet);
  };

  return (
    <View style={[styles.RollBtn]}>
      <ClaimBtn
        weekly={isWeekly}
        done={isDone}
        disabled={!shouldClaim || isDone}
        loading={linkingWallet || isClaiming}
        text={ text }
        onClick={claimHandler}
      />
    </View>
  )
})

function StartRewardClaimButton({ userId, setDisplayWeekly, setDisplayDaily }: StartUserRewardProps) {
  const store = useStores();
  const navigation = useNavigation<NavigationProp>();
  const dailyProgress = store.rewards.dailyProgress(userId);
  const shouldClaimDaily = store.rewards.shouldClaimDaily(userId);
  const hasClaimedDaily = store.rewards.hasClaimedDaily(userId);
  const shouldClaimWeekly = store.rewards.shouldClaimWeekly(userId);
  const hasClaimedWeekly = store.rewards.hasClaimedWeekly(userId);
  const isClaimingDaily = store.rewards.isClaimingDaily(userId);
  const isClaimingWeekly = store.rewards.isClaimingWeekly(userId);

  let text = 'Dailies Start 12am UTC!';
  let done = false;
  let disabled = false;
  let loading = false;

  function onClick() {
    if (!store.session.hasSession) {
      navigation.navigate('SignIn');
      return;
    }
    if (shouldClaimDaily && !isClaimingDaily && !hasClaimedDaily) {
      setDisplayDaily(true);
      return;
    }
    if (shouldClaimWeekly && !isClaimingWeekly && !hasClaimedWeekly) {
      setDisplayWeekly(true);
      return;
    }
    navigation.navigate('Home');
  }

  if (shouldClaimDaily || isClaimingDaily || dailyProgress.percent < 1) {
    text = !store.session.hasSession 
      ? "Sign In"
      : hasClaimedDaily
      ? "Check your wallet!"
      : shouldClaimDaily
      ? "Claim Daily Reward"
      : isClaimingDaily
      ? "Claiming Daily..."
      : dailyProgress.percent
      ? "Keep Going!"
      : "Like Or Post Something";
    done = hasClaimedDaily;
    disabled = isClaimingDaily || done;
    loading = !!isClaimingDaily;
  } else if (hasClaimedDaily && (shouldClaimWeekly || isClaimingWeekly)) {
    text = !store.session.hasSession
      ? 'Sign In'
      : hasClaimedWeekly
      ? 'Check your wallet!'
      : shouldClaimWeekly
      ? 'Claim Weekly Reward'
      : isClaimingWeekly
      ? 'Claiming Weekly...'
      : 'never';
      done = hasClaimedWeekly;
      disabled = isClaimingWeekly || done;
      loading = !!isClaimingWeekly;
  }

  return (
    <View>
      <ClaimBtn
        text={ text }
        done = { done }
        disabled = { disabled }
        loading = { loading }
        onClick = { onClick }
      ></ClaimBtn>
    </View>
  )
}


function RewardClaimed({ userId, setDisplayWeekly }: UserRewardProps) {
  const store = useStores();
  const weeklyReward = store.rewards.weeklyReward(userId);
  const dailyReward = store.rewards.dailyReward(userId);
  return (
    <View>
      { weeklyReward ? (
        <RewardClaimedImage userId={ userId } rewardsImg={ weeklyReward.image }></RewardClaimedImage>
      ) : dailyReward ? (
        <RewardClaimedImage userId={ userId } rewardsImg={ dailyReward.image }></RewardClaimedImage>
      ) : (
        <span>never</span>
      )}
      <PostRewardClaimedButton userId={ userId } setDisplayWeekly={ setDisplayWeekly }></PostRewardClaimedButton>
    </View>
  )
}

function RewardClaimScreen({ userId, setDisplayWeekly, source, isWeekly }: UserClaimProps) {
  const pal = usePalette("default");
  const store = useStores();
  const reward = isWeekly ? store.rewards.weeklyReward(userId) : store.rewards.dailyReward(userId);

  return (
    <View>
      { reward ? (
        <RewardClaimed userId={ userId } setDisplayWeekly={ setDisplayWeekly }></RewardClaimed>
      ) : (
        <View style={ styles.DiceRowCol }>
          <Text type="lg-thin">You’ve completed a milestone!</Text>
          <Text type="2xl-bold" style={[pal.text, styles.DiceRollText]}>
            Claim Your { isWeekly ? 'Weekly' : 'Daily' } Reward!
          </Text>
          <Image
            source={ source }
            style={styles.DiceRollImage}
          />
          <RewardClaimButton userId={ userId } isWeekly={ !!isWeekly }></RewardClaimButton>
        </View>
      )}
    </View>
  )
}

function DailyPointsProgress({ count }: { count: number }) {
  return (
    <View style={styles.streaksContainerBox}>
      <Text type="sm-thin" style={{ color: colors.gray4, paddingBottom: 4 }}>
        POINTS
      </Text>
      <View>
        <Text type="lg-bold" style={styles.textPadding}>
          {count ?? 0}<Text type="xs-heavy" style={{ color: colors.gray4 }}>/50</Text>
        </Text>
      </View>
    </View>
  )
}

function WeeklyStreakProgress({ count }: { count: number }) {
  return (
    <View style={styles.streaksContainerBox}>
      <Text type="sm-thin" style={{ 
        color: colors.gray4,
        paddingBottom: 4,
        textAlign: "center",
        textAlignVertical: "bottom",
       }}>
        DAYS
      </Text>
      <View style={styles.horizontalBox}>
        {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => { 
          return (
            <Day key={idx} day={day} isCompleted={day <= (count || -1)}/>
          );
        })}
      </View>
    </View>
  )
}

function RewardProgressScreen({ userId, setDisplayWeekly, setDisplayDaily }: StartUserRewardProps) {
  const store = useStores();
  const dailyProgress = store.rewards.dailyProgress(userId);
  const weeklyProgress = store.rewards.weeklyProgress(userId);
  return (
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
        <Text type="md-medium" style={[styles.textPadding, { paddingVertical: 8, flex: 1 }]}>
          Create / engage with community posts to start a streak and win reactions!
        </Text>
        <View style={styles.dataContainer}>
          <View style={styles.horizontalBox}>
            <DailyPointsProgress count={ dailyProgress.count }></DailyPointsProgress>
            <WeeklyStreakProgress count={ weeklyProgress.count }></WeeklyStreakProgress>
          </View>
          <View style={[
            styles.claimBtnContainer,
            { paddingVertical: isMobileWeb ? 8 : 0 },
            ]}>
              <StartRewardClaimButton 
                userId={userId} 
                setDisplayWeekly={ setDisplayWeekly }
                setDisplayDaily={ setDisplayDaily}
              ></StartRewardClaimButton>
          </View>
        </View>
      </View>
    </View>
  )
}

export const RewardsCard = observer(function RewardsCard({ userId } : { userId: string} ) {
  const store = useStores();
  const isClaimingWeekly = store.rewards.isClaimingWeekly(userId);
  const isClaimingDaily = store.rewards.isClaimingDaily(userId);
  const hasClaimedDaily = store.rewards.hasClaimedDaily(userId);
  const { screen } = useAnalytics();

  const [displayDaily, setDisplayDaily] = useState<boolean>(false);
  const [displayWeekly, setDisplayWeekly] = useState<boolean>(false);

  const shouldDisplayDaily = displayDaily;
  const shouldDisplayWeekly = hasClaimedDaily && displayWeekly;

  useFocusEffect(
    React.useCallback(() => {
      screen("Rewards");

      if (userId !== "") {
        store.rewards.fetchMissions(userId);
      }
    }, [store, screen]),
  );

  return (
    <View style={[styles.outer, s.h100pct]}>
      { shouldDisplayDaily && !shouldDisplayWeekly ? (
        <RewardClaimScreen 
          userId={ userId }
          setDisplayWeekly={ setDisplayWeekly }
          source={require("../../../../assets/reactions/dice.gif")}
        ></RewardClaimScreen>
      ) : displayWeekly ? (
        <RewardClaimScreen 
          userId={ userId }
          setDisplayWeekly={ setDisplayWeekly }
          source={ isClaimingWeekly ? require("../../../../assets/ChestOpening.gif") : require("../../../../assets/ChestClosed.png")}
          isWeekly={ true }
        ></RewardClaimScreen>
      ) : (
        <RewardProgressScreen
          userId={ userId }
          setDisplayDaily={ setDisplayDaily }
          setDisplayWeekly={ setDisplayWeekly }
        ></RewardProgressScreen>
      )}
    </View>
  );
})

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
