import { FlatList, Image, StyleSheet, View } from "react-native";
import { colors, s } from "lib/styles";
import { isDesktopWeb, isMobileWeb } from "platform/detection";

import { CenteredView } from "view/com/util/Views.web";
import { ClaimBtn } from "view/com/rewards/ClaimBtn";
import { CommonNavigatorParams } from "lib/routes/types";
import { ErrorMessage } from "view/com/util/error/ErrorMessage";
import { GENESIS_REACTIONS } from "lib/constants";
import { HelpTip } from "view/com/auth/util/HelpTip";
import { Link } from "view/com/util/Link";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RadioButton } from "view/com/util/forms/RadioButton";
import React from "react";
import { ScrollView } from "../com/util/Views";
import { Text } from "view/com/util/text/Text";
import { ToggleButton } from "view/com/util/forms/ToggleButton";
import { TouchableOpacity } from "react-native-gesture-handler";
import { UserAvatar } from "view/com/util/UserAvatar";
import { ViewHeader } from "view/com/util/ViewHeader";
import { observer } from "mobx-react-lite";
import { useColorSchemeStyle } from "lib/hooks/useColorSchemeStyle";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { withAuthRequired } from "view/com/auth/withAuthRequired";

const InfoText = ({ text }: { text: string }) => {
  const pal = usePalette("error");
  return (
    <View style={[pal.view, styles.outer]}>
      <View>
        <Image
          style={{ width: 24, height: 24, marginRight: 8 }}
          source={require("../../../assets/trophy.png")}
        />
      </View>
      <Text
        type="sm-medium"
        style={[{ flex: 1, paddingRight: 10 }, pal.text, { color: "black" }]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
};

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

const DisplayReactions = observer(function DisplayReactions() {
  const pal = usePalette("default");
  const store = useStores();

  const onPressReactionPack = (reactionPack: string) => {
    if (reactionPack === store.reactions.curReactionsSet) {
      store.reactions.selectReactionSet("default");
      return;
    }
    store.reactions.earnedReactions[reactionPack]?.length
      ? store.reactions.selectReactionSet(reactionPack)
      : {};
  };

  return (
    <View>
      <View style={s.p10}>
        <InfoText text="Reaction packs are on chain collectibles that allow you to uniquely express yourself on Solarplex posts. Engage with/create posts to win points and unlock packs!" />
      </View>
      {Object.keys(store.reactions.reactionSets).map((reactionPack) => (
        <View
          style={[
            pal.view,
            !store.reactions.earnedReactions[reactionPack]?.length && {
              opacity: 0.2,
            },
          ]}
        >
          <View style={styles.HeaderRow}>
            <View style={styles.horizontalContainer}>
              <UserAvatar
                size={25}
                avatar={"https://i.ibb.co/NLkvySY/blob.png"}
              />

              <View
                style={
                  isMobileWeb ? styles.verticalView : styles.horizontalView
                }
              >
                <Text type="lg-heavy" style={[pal.text, styles.textPadding]}>
                  Solarplex {reactionPack} Reactions
                </Text>
                <Text
                  type="sm-heavy"
                  style={[pal.text, styles.textPadding, styles.reaction]}
                >
                  {Math.min(
                    store.reactions.earnedReactions[reactionPack]?.length ?? 0,
                    11,
                  )}
                  /{store.reactions.reactionSets[reactionPack]?.length} Reactions
                </Text>
              </View>
            </View>

            <ToggleButton
              type="default-light"
              isSelected={store.reactions.curReactionsSet === reactionPack}
              onPress={() => onPressReactionPack(reactionPack)}
              label=""
            />
          </View>
          <View style={styles.reactionList}>
            {/* <RadioButton
            label={""}
            isSelected={store.reactions.curReactionsSet === reactionPack}
            onPress={() => {}}
          /> */}

            <FlatList
              data={store.reactions.reactionSets[reactionPack]}
              numColumns={isMobileWeb ? 4 : 4}
              key={4}
              renderItem={({ item }) => {
                console.log(
                  "check",
                  store.reactions.earnedReactions[reactionPack],
                  item.reaction_id,
                );
                if (
                  store.reactions.earnedReactions[reactionPack]?.find(
                    (reaction) => reaction.reaction_id === item.reaction_id,
                  )
                ) {
                  return (
                    <View style={{ paddingHorizontal: isMobileWeb ? 8 : 12 }}>
                      <Image
                        source={{
                          uri: item.nft_metadata.image,
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
                      <GrayedImage image={item.nft_metadata.image} />
                    </View>
                  );
                }
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
});

type Props = NativeStackScreenProps<CommonNavigatorParams, "Missions">;
export const MissionsTab = withAuthRequired(
  observer(() => {
    const pal = usePalette("default");
    const store = useStores();

    return (
      <View style={pal.view}>
        <View testID="communitiesScreen" style={s.hContentRegion}>
          <CenteredView style={styles.container}>
            <ScrollView
              style={[s.hContentRegion]}
              contentContainerStyle={!isDesktopWeb && pal.viewLight}
              scrollIndicatorInsets={{ right: 1 }}
            >
              <ViewHeader title="Reactions" canGoBack={false} />
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
              {/* TODO: (Pratik) We should surely work on improving this
              {!store.reactions.earnedReactions[reactionPack]?.length && (
                <Text type="lg-heavy" style={[pal.text, styles.textPadding]}>
                  {" "}
                  Request Genesis NFTs from{" "}
                  <Link href="/profile/viksit.live.solarplex.xyz">
                    @viksit.live.solarplex.xyz
                  </Link>{" "}
                </Text>
              )} */}
              <DisplayReactions />
            </ScrollView>
          </CenteredView>
        </View>
      </View>
    );
  }),
);

const styles = StyleSheet.create({
  outer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEDC9B",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  reactionsBox: {
    backgroundColor: colors.gray1,
  },
  horizontalView: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  verticalView: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    flexWrap: "wrap",
  },
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
    flexWrap: "wrap",
  },
  horizontalContainer: {
    flexDirection: "row",
    // alignItems: "center",
    justifyContent: "space-between",
  },
  HeaderItemVStack: {
    flexDirection: "column",
    alignItems: "center",
  },
  textPadding: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexWrap: "wrap",
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },
  reaction: {
    backgroundColor: colors.gray2,
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
