import {
  CommentBottomArrow,
  HeartIcon,
  HeartIconSolid,
  RegularFaceSmileIcon,
  SolidFaceSmileIcon,
} from "lib/icons";
import { DropdownButton, PostDropdownBtn } from "../forms/DropdownButton";
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import React, { useCallback, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, s } from "lib/styles";

import { Haptics } from "lib/haptics";
import { Image } from "expo-image";
import { NavigationProp } from "lib/routes/types";
import { Reaction } from "react-native-reactions";
import { ReactionDropdownButton } from "../forms/ReactionDropdownButton";
import { ReactionList } from "view/com/reactions/ReactionList";
import { RepostButton } from "./RepostButton";
import { SolarplexReaction } from "state/models/media/reactions";
// DISABLED see #135
// import {
//   TriggerableAnimated,
//   TriggerableAnimatedRef,
// } from './anim/TriggerableAnimated'
import { Text } from "../text/Text";
import { faSmile } from "@fortawesome/free-regular-svg-icons";
import { faSmile as faSmileFilled } from "@fortawesome/free-solid-svg-icons";
import { isMobileWeb } from "platform/detection";
import { useNavigation } from "@react-navigation/native";
import { useObserver } from "mobx-react-lite";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { useTheme } from "lib/ThemeContext";

interface EmojiItemProp {
  id: number;
  emoji: React.ReactNode | string | number;
  title: string;
}

interface PostCtrlsOpts {
  itemUri: string;
  itemCid: string;
  itemHref: string;
  itemTitle: string;
  isAuthor: boolean;
  author: {
    handle: string;
    displayName: string;
    avatar: string;
  };
  text: string;
  indexedAt: string;
  big?: boolean;
  style?: StyleProp<ViewStyle>;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  reactions?: string[];
  viewerReaction?: string;
  isReposted: boolean;
  isLiked: boolean;
  isThreadMuted: boolean;
  onPressReply: () => void;
  onPressReaction: (reactionId: string, remove?: boolean) => Promise<void>;
  onPressToggleRepost: () => Promise<void>;
  onPressToggleLike: () => Promise<void>;
  onCopyPostText: () => void;
  onOpenTranslate: () => void;
  onToggleThreadMute: () => void;
  onDeletePost: () => void;
}
const HITSLOP = { top: 5, left: 5, bottom: 5, right: 5 };

// DISABLED see #135
/*
function ctrlAnimStart(interp: Animated.Value) {
  return Animated.sequence([
    Animated.timing(interp, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.delay(50),
    Animated.timing(interp, {
      toValue: 0,
      duration: 20,
      useNativeDriver: true,
    }),
  ])
}

function ctrlAnimStyle(interp: Animated.Value) {
  return {
    transform: [
      {
        scale: interp.interpolate({
          inputRange: [0, 1.0],
          outputRange: [1.0, 4.0],
        }),
      },
    ],
    opacity: interp.interpolate({
      inputRange: [0, 1.0],
      outputRange: [1.0, 0.0],
    }),
  }
}
*/

export function PostCtrls(opts: PostCtrlsOpts) {
  const store = useStores();
  const theme = useTheme();
  const pal = usePalette("default");
  const navigation = useNavigation<NavigationProp>();
  const defaultReactions = useObserver(() => store.reactions.curReactionsSet);
  const reactionSet = useObserver(
    () => store.reactions.earnedReactions[defaultReactions],
  );
  const defaultCtrlColor = React.useMemo(
    () => ({
      color: theme.palette.default.postCtrl,
    }),
    [theme],
  ) as StyleProp<ViewStyle>;
  // DISABLED see #135
  // const repostRef = React.useRef<TriggerableAnimatedRef | null>(null)
  // const likeRef = React.useRef<TriggerableAnimatedRef | null>(null)
  const onRepost = useCallback(() => {
    store.shell.closeModal();
    if (!opts.isReposted) {
      Haptics.default();
      opts.onPressToggleRepost().catch((_e) => undefined);
      // DISABLED see #135
      // repostRef.current?.trigger(
      //   {start: ctrlAnimStart, style: ctrlAnimStyle},
      //   async () => {
      //     await opts.onPressToggleRepost().catch(_e => undefined)
      //     setRepostMod(0)
      //   },
      // )
    } else {
      opts.onPressToggleRepost().catch((_e) => undefined);
    }
  }, [opts, store.shell]);

  const onQuote = useCallback(async () => {
    store.shell.closeModal();
    store.session.isSolarplexSession
      ? navigation.navigate("SignIn")
      : store.shell.openComposer({
          quote: {
            uri: opts.itemUri,
            cid: opts.itemCid,
            text: opts.text,
            author: opts.author,
            indexedAt: opts.indexedAt,
          },
        });
    Haptics.default();
  }, [
    opts.author,
    opts.indexedAt,
    opts.itemCid,
    opts.itemUri,
    opts.text,
    store.shell,
    store.session.isSolarplexSession,
    navigation,
  ]);

  const onPressToggleLikeWrapper = async () => {
    if (!opts.isLiked) {
      Haptics.default();
      await opts.onPressToggleLike().catch((_e) => undefined);
      // DISABLED see #135
      // likeRef.current?.trigger(
      //   {start: ctrlAnimStart, style: ctrlAnimStyle},
      //   async () => {
      //     await opts.onPressToggleLike().catch(_e => undefined)
      //     setLikeMod(0)
      //   },
      // )
      // setIsLikedPressed(false)
    } else {
      await opts.onPressToggleLike().catch((_e) => undefined);
      // setIsLikedPressed(false)
    }
  };
  const [selectedEmoji, setSelectedEmoji] = useState<
    SolarplexReaction | undefined
  >(store.reactions.reactionTypes[opts.viewerReaction ?? " "]);

  const onPressReaction = async (emoji: SolarplexReaction | undefined) => {
    if (!emoji) {
      onRemoveReaction();
      return;
    }
    if (selectedEmoji) {
      onRemoveReaction();
    }
    // console.log("emoji", emoji);
    setSelectedEmoji(emoji);
    await opts.onPressReaction(emoji.id).catch((_e) => undefined);
  };

  const onRemoveReaction = async () => {
    await opts
      .onPressReaction(selectedEmoji?.id ?? '', true)
      .catch((_e) => undefined);
    setSelectedEmoji(undefined);
  };

  return (
    <View style={[styles.ctrls, opts.style]}>
      <TouchableOpacity
        testID="replyBtn"
        style={styles.ctrl}
        hitSlop={HITSLOP}
        onPress={opts.onPressReply}
        accessibilityRole="button"
        accessibilityLabel="Reply"
        accessibilityHint="reply composer"
      >
        <CommentBottomArrow
          style={[defaultCtrlColor, opts.big ? s.mt2 : styles.mt1]}
          strokeWidth={3}
          size={opts.big ? 20 : 15}
        />
        {typeof opts.replyCount !== "undefined" ? (
          <Text style={[defaultCtrlColor, s.ml5, s.f15]}>
            {opts.replyCount}
          </Text>
        ) : undefined}
      </TouchableOpacity>
      <RepostButton {...opts} onRepost={onRepost} onQuote={onQuote} />

      <TouchableOpacity
        testID="likeBtn"
        style={styles.ctrl}
        hitSlop={HITSLOP}
        onPress={onPressToggleLikeWrapper}
        accessibilityRole="button"
        accessibilityLabel={opts.isLiked ? "Unlike" : "Like"}
        accessibilityHint=""
      >
        {opts.isLiked ? (
          <HeartIconSolid
            style={styles.ctrlIconLiked}
            size={opts.big ? 22 : 16}
          />
        ) : (
          <HeartIcon
            style={[defaultCtrlColor, opts.big ? styles.mt1 : undefined]}
            strokeWidth={3}
            size={opts.big ? 20 : 16}
          />
        )}
        {typeof opts.likeCount !== "undefined" ? (
          <Text
            testID="likeCount"
            style={
              opts.isLiked
                ? [s.bold, s.red3, s.f15, s.ml5]
                : [defaultCtrlColor, s.f15, s.ml5]
            }
          >
            {opts.likeCount}
          </Text>
        ) : undefined}
      </TouchableOpacity>
      <TouchableOpacity
        testID="reactBtn"
        style={styles.emojiCtrl}
        hitSlop={{
          left: 10,
          right: 10,
          top: HITSLOP.top,
          bottom: HITSLOP.bottom,
        }}
        accessibilityRole="button"
        accessibilityLabel={opts.viewerReaction ? "Reacted" : "React"}
        accessibilityHint=""
        onPress={
          store.session.isSolarplexSession
            ? () => navigation.navigate("SignIn")
            : onRemoveReaction
        }
      >
        {reactionSet?.length ? (
          <ReactionDropdownButton
            testID="communityHeaderDropdownBtn"
            type="bare"
            items={reactionSet}
            style={[
              styles.btn,
              styles.secondaryBtn,
              {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
            onPressReaction={onPressReaction}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {!opts.big && opts.reactions?.length !== undefined ? (
                <View testID="testing" style={styles.emojiSet}>
                  {/* {opts.reactions?.map((item, index) =>
                    index < 4 && store.reactions.reactionTypes[item] ? (
                      (
                        store.reactions.reactionTypes[item]?.nft_metadata?.image as string
                      ).includes("http") ? (
                        <Image
                          style={styles.image}
                          source={{
                            uri: store.reactions.reactionTypes[item]
                              ?.nft_metadata?.image as string,
                          }}
                        />
                      ) : (
                        <Text
                          key={item}
                          style={[
                            defaultCtrlColor,
                            s.f15,
                            { marginLeft: index ? -8 : 0, zIndex: -1 * index },
                          ]}
                        >
                          {store.reactions.reactionTypes[item]?.nft_metadata?.image}
                        </Text>
                      )
                    ) : null,
                  )} */}
                  <ReactionList reactions={opts.reactions} />
                </View>
              ) : (
                <></>
              )}
              {selectedEmoji ? (
                <TouchableOpacity onPress={onRemoveReaction}>
                  <SolidFaceSmileIcon />
                </TouchableOpacity>
              ) : store.session.isSolarplexSession ? (
                <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                  <RegularFaceSmileIcon />
                </TouchableOpacity>
              ) : (
                <RegularFaceSmileIcon />
              )}
              <Text
                testID="likeCount"
                style={[
                  defaultCtrlColor,
                  s.f15,
                  s.ml5,
                  {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "4px",
                  },
                ]}
              >
                {opts.reactions?.length ? opts.reactions.length : <></>}
              </Text>
            </View>
          </ReactionDropdownButton>
        ) : undefined}
      </TouchableOpacity>
      <View>
        {opts.big ? undefined : (
          <PostDropdownBtn
            testID="postDropdownBtn"
            style={styles.ctrl}
            itemUri={opts.itemUri}
            itemCid={opts.itemCid}
            itemHref={opts.itemHref}
            itemTitle={opts.itemTitle}
            isAuthor={opts.isAuthor}
            isThreadMuted={opts.isThreadMuted}
            onCopyPostText={opts.onCopyPostText}
            onOpenTranslate={opts.onOpenTranslate}
            onToggleThreadMute={opts.onToggleThreadMute}
            onDeletePost={opts.onDeletePost}
          >
            <FontAwesomeIcon
              icon="ellipsis-h"
              size={18}
              style={[
                s.mt2,
                s.mr5,
                {
                  color:
                    theme.colorScheme === "light" ? colors.gray4 : colors.gray5,
                } as FontAwesomeIconStyle,
              ]}
            />
          </PostDropdownBtn>
        )}
      </View>
      {/* used for adding pad to the right side */}
      <View />
    </View>
  );
}

const styles = StyleSheet.create({
  ctrls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctrl: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    margin: -5,
  },
  ctrlIconLiked: {
    color: colors.red3,
  },
  mt1: {
    marginTop: 1,
  },
  emojiCtrl: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    margin: -5,
  },
  emojiSet: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  emojiContainerStyle: {
    backgroundColor: "gray",
    width: "100px",
    height: " 100px",
  },
  cardStyle: {
    left: "0",
    top: "30px",
  },
  cardStyleBig: {
    left: "0",
    top: "20px",
  },
  cardStyleMobile: {
    left: "7rem",
    top: "0px",
    flexWrap: "wrap",
    width: "225px",
  },
  cardStyleMobileBig: {
    left: "-11rem",
    flexWrap: "wrap",
    width: "225px",
  },
  image: {
    // width: '100%',
    // height: '100%',
    resizeMode: "contain",
    width: 20,
    height: 20,
    margin: -6,
  },
  secondaryBtn: {
    // paddingHorizontal: 14,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: 7,
    borderRadius: 50,
  },
});
