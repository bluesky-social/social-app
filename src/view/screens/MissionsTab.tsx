import { FlatList, Image, StyleSheet, View } from "react-native";
import { colors, s } from "lib/styles";
import { isDesktopWeb, isMobileWeb } from "platform/detection";

import { CenteredView } from "view/com/util/Views.web";
import { ClaimBtn } from "view/com/rewards/ClaimBtn";
import { CommonNavigatorParams } from "lib/routes/types";
import { GENESIS_REACTIONS } from "lib/constants";
import { Link } from "view/com/util/Link";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RadioButton } from "view/com/util/forms/RadioButton";
import React from "react";
import { ReactionCollections } from "state/models/media/reactions";
import { ScrollView } from "../com/util/Views";
import { Text } from "view/com/util/text/Text";
import { TouchableOpacity } from "react-native-gesture-handler";
import { UserAvatar } from "view/com/util/UserAvatar";
import { observer } from "mobx-react-lite";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

const solarplexreactionsList = [
  {
    name: "Smile",
    src: require("../../../assets/reactions/1.png"),
    isClaimed: true,
  },
  {
    name: "Sad",
    src: require("../../../assets/reactions/2.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/3.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/4.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/5.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/6.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/7.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/8.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/9.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/10.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/11.png"),
    isClaimed: true,
  },
];

const squidzReactionsList = [
  {
    name: "Blush",
    src: require("../../../assets/reactions/blush.png"),
    isClaimed: true,
  },
  {
    name: "Cry",
    src: require("../../../assets/reactions/cry.png"),
    isClaimed: true,
  },
  {
    name: "Laugh cry",
    src: require("../../../assets/reactions/laugh-cry.png"),
    isClaimed: true,
  },
  {
    name: "Fire",
    src: require("../../../assets/reactions/fire.png"),
    isClaimed: true,
  },
  {
    name: "Glasses",
    src: require("../../../assets/reactions/glasses.png"),
    isClaimed: true,
  },
  {
    name: "Smile",
    src: require("../../../assets/reactions/smile.png"),
    isClaimed: true,
  },
  {
    name: "Love",
    src: require("../../../assets/reactions/love.png"),
    isClaimed: true,
  },
  {
    name: "Hehe-zombie",
    src: require("../../../assets/reactions/hehe-zombie.png"),
    isClaimed: true,
  },
  {
    name: "Cant-even",
    src: require("../../../assets/reactions/cant-even.png"),
    isClaimed: true,
  },
  {
    name: "heart-eyes",
    src: require("../../../assets/reactions/heart-eyes.png"),
    isClaimed: true,
  },
  {
    name: "eyebrow-raised",
    src: require("../../../assets/reactions/eyebrow-raised.png"),
    isClaimed: true,
  },
];

export const GrayedImage = ({ image }: { image: any }) => {
  return (
    <View>
      <Image
        source={{
          uri: image,
        }}
        style={{
          tintColor: "gray",
          width: isMobileWeb ? 50 : 100,
          height: isMobileWeb ? 50 : 100,
        }}
      />
      <Image
        source={{
          uri: image,
        }}
        style={{
          position: "absolute",
          opacity: 0.17,
          width: isMobileWeb ? 50 : 100,
          height: isMobileWeb ? 50 : 100,
        }}
      />
    </View>
  );
};

const DisplayReactions = observer(() => {
  const pal = usePalette("default");
  const store = useStores();

  const onPressReactionPack = (reactionPack: ReactionCollections) => {
    if (reactionPack === store.reactions.curReactionsSet) {
      store.reactions.selectReactionSet("default");
      return;
    }
    store.reactions.earnedReactions[reactionPack]?.length
      ? store.reactions.selectReactionSet(reactionPack)
      : {};
  };
  return (
    <View
      style={[
        pal.view,
        !store.reactions.earnedReactions["genesis"]?.length && { opacity: 0.2 },
      ]}
    >
      <TouchableOpacity onPress={() => onPressReactionPack("genesis")}>
        <View style={styles.HeaderRow}>
          <View style={styles.horizontalView}>
            <UserAvatar
              size={40}
              avatar={"https://i.ibb.co/NLkvySY/blob.png"}
            />

            <Text type="lg-heavy" style={[pal.text, styles.textPadding]}>
              @plexi.live.solarplex.xyz
            </Text>
          </View>
          <View>
            <Text type="sm-bold" style={[pal.text, styles.reaction]}>
              {Math.min(
                store.reactions.earnedReactions.genesis?.length ?? 0,
                11,
              )}
              /11 Reactions
            </Text>
          </View>
        </View>
        <View style={styles.reactionList}>
          <RadioButton
            label={""}
            isSelected={store.reactions.curReactionsSet === "genesis"}
            onPress={() => {}}
          />
          <FlatList
            data={GENESIS_REACTIONS}
            numColumns={isMobileWeb ? 4 : 4}
            key={4}
            renderItem={({ item }) => {
              if (
                store.reactions.earnedReactions["genesis"]?.find(
                  (reaction) => reaction.emoji === item.emoji,
                )
              ) {
                return (
                  <View style={{ paddingHorizontal: isMobileWeb ? 8 : 12 }}>
                    <Image
                      source={{
                        uri: item.emoji,
                      }}
                      style={{
                        width: isMobileWeb ? 50 : 100,
                        height: isMobileWeb ? 50 : 100,
                      }}
                    />
                  </View>
                );
              } else {
                return (
                  <View style={{ paddingHorizontal: isMobileWeb ? 8 : 12 }}>
                    <GrayedImage image={item.emoji} />
                  </View>
                );
              }
            }}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
});

type Props = NativeStackScreenProps<CommonNavigatorParams, "MissionsTab">;
export const MissionsTab = withAuthRequired(
  observer(() => {
    const pal = usePalette("default");
    const store = useStores();

    return (
      <CenteredView style={styles.container}>
        <ScrollView
          style={[s.hContentRegion]}
          contentContainerStyle={!isDesktopWeb && pal.viewLight}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* <View style={styles.HeaderRow}>
            <View style={styles.horizontalView}>
              <UserAvatar size={40} avatar={"https://picsum.photos/300/300"} />

              <Text type="lg-heavy" style={[pal.text, styles.textPadding]}>
                @squids.live.solarplex.xyz
              </Text>
            </View>
            <View>
              <Text type="sm-bold" style={[pal.text, styles.reaction]}>
                1/11 Reactions
              </Text>
            </View>
          </View>

          <View style={styles.reactionList}>
            <FlatList
              data={squidzReactionsList}
              numColumns={4}
              key={4}
              renderItem={({ item }) => {
                if (item.isClaimed) {
                  return (
                    <Image source={item.src} style={styles.reactionImage} />
                  );
                } else {
                  return <GrayedImage image={item.src} />;
                }
              }}
            />
          </View> */}
          {!store.reactions.earnedReactions["genesis"]?.length && (
            <Text type="lg-heavy" style={[pal.text, styles.textPadding]}>
              {" "}
              Request Genesis NFTs from{" "}
              <Link href="/profile/viksit.live.solarplex.xyz">
                @viksit.live.solarplex.xyz
              </Link>{" "}
            </Text>
          )}
          <DisplayReactions />
        </ScrollView>
      </CenteredView>
    );
  }),
);

const styles = StyleSheet.create({
  container: {
    // backgroundColor: colors.gray1,
    padding: 2,
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
  ImgView: {
    width: 150,
    height: 150,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  HeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  horizontalView: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  HeaderItemVStack: {
    flexDirection: "column",
    alignItems: "center",
  },
  textPadding: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  reactionImage: {
    width: 100,
    height: 100,
  },
  solarplexReactionContainer: {
    paddingHorizontal: 15,
  },
  solarplexReactionImage: {
    width: 100,
    height: 100,
  },
  reactionList: {
    width: "full",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reaction: {
    backgroundColor: colors.gray2,
    borderRadius: 32,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
