import { CommentBottomArrow, HeartIcon, HeartIconSolid } from "lib/icons";
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
import { NavigationProp } from "lib/routes/types";
import { PostDropdownBtn } from "../forms/DropdownButton";
import { Reaction } from "react-native-reactions";
import { RepostButton } from "./RepostButton";
// DISABLED see #135
// import {
//   TriggerableAnimated,
//   TriggerableAnimatedRef,
// } from './anim/TriggerableAnimated'
import { Text } from "../text/Text";
import { useNavigation } from "@react-navigation/native";
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
  isReposted: boolean;
  isLiked: boolean;
  isThreadMuted: boolean;
  onPressReply: () => void;
  onPressToggleRepost: () => Promise<void>;
  onPressToggleLike: () => Promise<void>;
  onCopyPostText: () => void;
  onOpenTranslate: () => void;
  onToggleThreadMute: () => void;
  onDeletePost: () => void;
}
const ReactionItems = [
  // {
  //   id: 0,
  //   emoji:
  //     "https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/link.png",
  //   title: "like",
  // },
  // {
  //   id: 1,
  //   emoji: "🥰",
  //   title: "love",
  // },
  // {
  //   id: 2,
  //   emoji: "🤗",
  //   title: "care",
  // },
  // {
  //   id: 3,
  //   emoji: "😘",
  //   title: "kiss",
  // },
  // {
  //   id: 4,
  //   emoji: "😂",
  //   title: "laugh",
  // },
  // {
  //   id: 5,
  //   emoji: "😎",
  //   title: "cool",
  // },
  {
    id: 0,
    emoji:
      "https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/link.png",
    title: "link",
  },
  {
    id: 1,
    emoji: "🥰",
    title: "love",
  },
  {
    id: 2,
    emoji: "🤗",
    title: "care",
  },
  {
    id: 3,
    emoji: "😘",
    title: "kiss",
  },
  {
    id: 4,
    emoji: "😂",
    title: "laugh",
  },
  {
    id: 5,
    emoji: "😎",
    title: "cool",
  },
  {
    id: 6,
    emoji: "🤔",
    title: "think",
  },
  {
    id: 7,
    emoji: "😴",
    title: "sleep",
  },
  {
    id: 8,
    emoji: "😲",
    title: "surprise",
  },
  {
    id: 9,
    emoji: "😤",
    title: "angry",
  },
  {
    id: 10,
    emoji: "🥳",
    title: "celebrate",
  },
  {
    id: 11,
    emoji: "🤓",
    title: "nerd",
  },
  {
    id: 12,
    emoji: "😭",
    title: "cry",
  },
  {
    id: 13,
    emoji: "😇",
    title: "angel",
  },
  {
    id: 14,
    emoji: "😷",
    title: "sick",
  },
  {
    id: 15,
    emoji: "🤩",
    title: "star-struck",
  },
  {
    id: 16,
    emoji: "😋",
    title: "tasty",
  },
  {
    id: 17,
    emoji: "😑",
    title: "meh",
  },
  {
    id: 18,
    emoji: "🥺",
    title: "pleading",
  },
  {
    id: 19,
    emoji: "😈",
    title: "devil",
  },
  {
    id: 20,
    emoji: "😜",
    title: "tease",
  },
  {
    id: 21,
    emoji: "🙄",
    title: "eyeroll",
  },
  {
    id: 22,
    emoji: "🤢",
    title: "disgust",
  },
  {
    id: 23,
    emoji: "😳",
    title: "blush",
  },
  {
    id: 24,
    emoji: "😵‍💫",
    title: "dizzy",
  },
];
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
  const navigation = useNavigation<NavigationProp>();

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
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiItemProp>();

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
      <Reaction
        items={ReactionItems}
        onTap={setSelectedEmoji}
        itemIndex={1}
        isShowCardInCenter={true}
      >
        <Text>{selectedEmoji ? selectedEmoji?.emoji : "React"}</Text>
      </Reaction>
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
  emojiContainerStyle: {
    backgroundColor: "gray",
    width: "100px",
    height: " 100px",
  },
});
