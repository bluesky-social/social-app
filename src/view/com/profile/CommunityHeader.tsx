import * as Toast from "../util/Toast";

import { DropdownButton, DropdownItem } from "../util/forms/DropdownButton";
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors, gradients, s } from "lib/styles";
import { isDesktopWeb, isNative } from "platform/detection";

import { BlurView } from "../util/BlurView";
import { CommunityFeedModel } from "state/models/feeds/community-feed";
import { FollowState } from "state/models/cache/my-follows";
import { LoadingPlaceholder } from "../util/LoadingPlaceholder";
import { NavigationProp } from "lib/routes/types";
import { ProfileImageLightbox } from "state/models/ui/shell";
import { ProfileModel } from "state/models/content/profile";
import React from "react";
import { RichText } from "../util/text/RichText";
import { Text } from "../util/text/Text";
import { TextLink } from "../util/Link";
import { UserAvatar } from "../util/UserAvatar";
import { UserBanner } from "../util/UserBanner";
import { formatCount } from "../util/numeric/format";
import { listUriToHref } from "lib/strings/url-helpers";
import { observer } from "mobx-react-lite";
import { pluralize } from "lib/strings/helpers";
import { sanitizeDisplayName } from "lib/strings/display-names";
import { shareUrl } from "lib/sharing";
import { toShareUrl } from "lib/strings/url-helpers";
import { useAnalytics } from "lib/analytics/analytics";
import { useNavigation } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";

const BACK_HITSLOP = { left: 30, top: 30, right: 30, bottom: 30 };

interface Props {
  view: CommunityFeedModel;
  onRefreshAll: () => void;
  hideBackButton?: boolean;
}

export const CommunityHeader = observer(
  ({ view, onRefreshAll, hideBackButton = false }: Props) => {
    const pal = usePalette("default");
    // loading
    // =
    if (!view || !view.hasLoaded) {
      return (
        <View style={pal.view}>
          <LoadingPlaceholder width="100%" height={120} />
          <View
            style={[
              pal.view,
              { borderColor: pal.colors.background },
              styles.avi,
            ]}
          >
            <LoadingPlaceholder width={80} height={80} style={styles.br40} />
          </View>
          <View style={styles.content}>
            <View style={[styles.buttonsLine]}>
              <LoadingPlaceholder width={100} height={31} style={styles.br50} />
            </View>
            <View>
              <Text type="title-2xl" style={[pal.text, styles.title]}>
                {"Loading"}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // error
    // =
    if (view.hasError) {
      return (
        <View testID="communityHeaderHasError">
          <Text>{view.error}</Text>
        </View>
      );
    }

    // loaded
    // =
    return (
      <CommunityHeaderLoaded
        view={view}
        onRefreshAll={onRefreshAll}
        hideBackButton={hideBackButton}
      />
    );
  },
);

const CommunityHeaderLoaded = observer(
  ({ view, onRefreshAll, hideBackButton = false }: Props) => {
    const pal = usePalette("default");
    const store = useStores();
    const navigation = useNavigation<NavigationProp>();
    const { track } = useAnalytics();

    const onPressBack = React.useCallback(() => {
      navigation.goBack();
    }, [navigation]);

    const onPressAvi = React.useCallback(() => {
      // if (view.data) {
      //   store.shell.openLightbox(new ProfileImageLightbox(view));
      // }
    }, [store, view]);

    const onPressToggleJoin = React.useCallback(async () => {
      // track(
      //   view.viewer.following
      //     ? "CommunityHeader:FollowButtonClicked"
      //     : "CommunityHeader:UnfollowButtonClicked",
      // );
      if (view.isJoined) {
        // leave
        track("CommunityHeader:LeaveButtonClicked");
        await store.me.joinedCommunities.leave(view);
        Toast.show("Removed from my communities");
      } else {
        // join
        track("CommunityHeader:JoinButtonClicked");
        await store.me.joinedCommunities.join(view);
        Toast.show("Added to my communities");
      }
    }, [track, view, store.log]);

    const onPressEditProfile = React.useCallback(() => {
      // track("CommunityHeader:EditProfileButtonClicked");
      // store.shell.openModal({
      //   name: "edit-profile",
      //   profileView: view,
      //   onUpdate: onRefreshAll,
      // });
    }, [track, store, view, onRefreshAll]);

    const onPressFollowers = React.useCallback(() => {
      // track("CommunityHeader:FollowersButtonClicked");
      // navigation.push("ProfileFollowers", { name: view.handle });
    }, [track, navigation, view]);

    const onPressFollows = React.useCallback(() => {
      // track("CommunityHeader:FollowsButtonClicked");
      // navigation.push("ProfileFollows", { name: view.handle });
    }, [track, navigation, view]);

    const onPressShare = React.useCallback(() => {
      track("CommunityHeader:ShareButtonClicked");
      const url = toShareUrl(`/community/${view.data?.id}`);
      shareUrl(url);
    }, [track, view]);

    const onPressAddRemoveLists = React.useCallback(() => {
      // track("CommunityHeader:AddToListsButtonClicked");
      // store.shell.openModal({
      //   name: "list-add-remove-user",
      //   subject: view.did,
      //   displayName: view.displayName || view.handle,
      // });
    }, [track, view, store]);

    const onPressMuteAccount = React.useCallback(async () => {
      // track("CommunityHeader:MuteAccountButtonClicked");
      // try {
      //   await view.muteAccount();
      //   Toast.show("Account muted");
      // } catch (e: any) {
      //   store.log.error("Failed to mute account", e);
      //   Toast.show(`There was an issue! ${e.toString()}`);
      // }
    }, [track, view, store]);

    const onPressUnmuteAccount = React.useCallback(async () => {
      // track("CommunityHeader:UnmuteAccountButtonClicked");
      // try {
      //   await view.unmuteAccount();
      //   Toast.show("Account unmuted");
      // } catch (e: any) {
      //   store.log.error("Failed to unmute account", e);
      //   Toast.show(`There was an issue! ${e.toString()}`);
      // }
    }, [track, view, store]);

    const onPressBlockAccount = React.useCallback(async () => {
      // track("CommunityHeader:BlockAccountButtonClicked");
      // store.shell.openModal({
      //   name: "confirm",
      //   title: "Block Account",
      //   message:
      //     "Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.",
      //   onPressConfirm: async () => {
      //     try {
      //       await view.blockAccount();
      //       onRefreshAll();
      //       Toast.show("Account blocked");
      //     } catch (e: any) {
      //       store.log.error("Failed to block account", e);
      //       Toast.show(`There was an issue! ${e.toString()}`);
      //     }
      //   },
      // });
    }, [track, view, store, onRefreshAll]);

    const onPressUnblockAccount = React.useCallback(async () => {
      // track("CommunityHeader:UnblockAccountButtonClicked");
      // store.shell.openModal({
      //   name: "confirm",
      //   title: "Unblock Account",
      //   message:
      //     "The account will be able to interact with you after unblocking.",
      //   onPressConfirm: async () => {
      //     try {
      //       await view.unblockAccount();
      //       onRefreshAll();
      //       Toast.show("Account unblocked");
      //     } catch (e: any) {
      //       store.log.error("Failed to unblock account", e);
      //       Toast.show(`There was an issue! ${e.toString()}`);
      //     }
      //   },
      // });
    }, [track, view, store, onRefreshAll]);

    const onPressReportAccount = React.useCallback(() => {
      // track("CommunityHeader:ReportAccountButtonClicked");
      // store.shell.openModal({
      //   name: "report-account",
      //   did: view.did,
      // });
    }, [track, store, view]);

    const isMe = React.useMemo(() => true, [store.me.did]);
    const dropdownItems: DropdownItem[] = React.useMemo(() => {
      let items: DropdownItem[] = [
        {
          testID: "communityHeaderDropdownShareBtn",
          label: "Share",
          onPress: onPressShare,
        },
      ];
      if (!store.session.isSolarplexSession) {
        // items.push({
        //   testID: "communityHeaderDropdownListAddRemoveBtn",
        //   label: "Add to Lists",
        //   onPress: onPressAddRemoveLists,
        // });
      }
      if (!isMe && !store.session.isSolarplexSession) {
        items.push({ sep: true });
        // if (!view.viewer.blocking) {
        //   items.push({
        //     testID: "communityHeaderDropdownMuteBtn",
        //     label: view.viewer.muted ? "Unmute Account" : "Mute Account",
        //     onPress: view.viewer.muted
        //       ? onPressUnmuteAccount
        //       : onPressMuteAccount,
        //   });
        // }
        // items.push({
        //   testID: "communityHeaderDropdownBlockBtn",
        //   label: view.viewer.blocking ? "Unblock Account" : "Block Account",
        //   onPress: view.viewer.blocking
        //     ? onPressUnblockAccount
        //     : onPressBlockAccount,
        // });
        // items.push({
        //   testID: "communityHeaderDropdownReportBtn",
        //   label: "Report Account",
        //   onPress: onPressReportAccount,
        // });
      }
      return items;
    }, [
      isMe,
      //view.viewer.muted,
      //view.viewer.blocking,
      onPressShare,
      onPressUnmuteAccount,
      onPressMuteAccount,
      onPressUnblockAccount,
      onPressBlockAccount,
      onPressReportAccount,
      onPressAddRemoveLists,
      store.session.isSolarplexSession,
    ]);

    // const blockHide = !isMe && (view.viewer.blocking || view.viewer.blockedBy);
    // const following = formatCount(view.followsCount);
    // const followers = formatCount(view.followersCount);
    // const pluralizedFollowers = pluralize(view.followersCount, "follower");
    return (
      <>
        {view && view.data && (
          <View style={pal.view}>
            <UserBanner banner={view.data.banner} />
            <View style={styles.content}>
              <View style={[styles.buttonsLine]}>
                {view.isJoined === true ? (
                  <TouchableOpacity
                    testID="leaveBtn"
                    onPress={onPressToggleJoin}
                    style={[styles.btn, styles.mainBtn, pal.btn]}
                    accessibilityRole="button"
                    accessibilityLabel={`Leave ${view.data.name}`}
                    accessibilityHint={`Leave ${view.data.name}`}
                  >
                    <FontAwesomeIcon
                      icon="check"
                      style={[pal.text, s.mr5]}
                      size={14}
                    />
                    <Text type="button" style={pal.text}>
                      Joined
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    testID="joinBtn"
                    onPress={onPressToggleJoin}
                    style={[styles.btn, styles.primaryBtn]}
                    accessibilityRole="button"
                    accessibilityLabel={`Join ${view.data.name}`}
                    accessibilityHint={`Joins ${view.data.name}`}
                  >
                    <FontAwesomeIcon
                      icon="plus"
                      style={[s.white as FontAwesomeIconStyle, s.mr5]}
                    />
                    <Text type="button" style={[s.white, s.bold]}>
                      Join
                    </Text>
                  </TouchableOpacity>
                )}
                {/* {!store.session.isSolarplexSession ? (
              isMe ? (
                <TouchableOpacity
                  testID="communityHeaderEditProfileButton"
                  onPress={onPressEditProfile}
                  style={[styles.btn, styles.mainBtn, pal.btn]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                  accessibilityHint="Opens editor for profile display name, avatar, background image, and description"
                >
                  <Text type="button" style={pal.text}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              ) : view.viewer.blocking ? (
                <TouchableOpacity
                  testID="unblockBtn"
                  onPress={onPressUnblockAccount}
                  style={[styles.btn, styles.mainBtn, pal.btn]}
                  accessibilityRole="button"
                  accessibilityLabel="Unblock"
                  accessibilityHint=""
                >
                  <Text type="button" style={[pal.text, s.bold]}>
                    Unblock
                  </Text>
                </TouchableOpacity>
              ) : !view.viewer.blockedBy ? (
                <>
                  {store.me.follows.getFollowState(view.did) ===
                  FollowState.Following ? (
                    <TouchableOpacity
                      testID="unfollowBtn"
                      onPress={onPressToggleFollow}
                      style={[styles.btn, styles.mainBtn, pal.btn]}
                      accessibilityRole="button"
                      accessibilityLabel={`Unfollow ${view.handle}`}
                      accessibilityHint={`Hides direct posts from ${view.handle} in your feed`}
                    >
                      <FontAwesomeIcon
                        icon="check"
                        style={[pal.text, s.mr5]}
                        size={14}
                      />
                      <Text type="button" style={pal.text}>
                        Following
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      testID="followBtn"
                      onPress={onPressToggleFollow}
                      style={[styles.btn, styles.primaryBtn]}
                      accessibilityRole="button"
                      accessibilityLabel={`Follow ${view.handle}`}
                      accessibilityHint={`Shows direct posts from ${view.handle} in your feed`}
                    >
                      <FontAwesomeIcon
                        icon="plus"
                        style={[s.white as FontAwesomeIconStyle, s.mr5]}
                      />
                      <Text type="button" style={[s.white, s.bold]}>
                        Follow
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : null
            ) : null} */}
                {dropdownItems?.length ? (
                  <DropdownButton
                    testID="communityHeaderDropdownBtn"
                    type="bare"
                    items={dropdownItems}
                    style={[styles.btn, styles.secondaryBtn, pal.btn]}
                  >
                    <FontAwesomeIcon icon="ellipsis" style={[pal.text]} />
                  </DropdownButton>
                ) : undefined}
              </View>
              <View>
                <Text
                  testID="communityHeaderDisplayName"
                  type="title-2xl"
                  style={[pal.text, styles.title]}
                >
                  {sanitizeDisplayName(view.data?.name)}
                </Text>
              </View>
              {/* <View style={styles.handleLine}>
            {view.viewer.followedBy && !blockHide ? (
              <View style={[styles.pill, pal.btn, s.mr5]}>
                <Text type="xs" style={[pal.text]}>
                  Follows you
                </Text>
              </View>
            ) : undefined}
            <Text style={[pal.textLight, styles.handle]}>@{view.handle}</Text>
          </View> */}
              <>
                <View style={styles.metricsLine}>
                  {/* <TouchableOpacity
                testID="communityHeaderFollowersButton"
                style={[s.flexRow, s.mr10]}
                onPress={onPressFollowers}
                accessibilityRole="button"
                accessibilityLabel={`${followers} ${pluralizedFollowers}`}
                accessibilityHint={"Opens followers list"}
              >
                <Text type="md" style={[s.bold, s.mr2, pal.text]}>
                  {followers}
                </Text>
                <Text type="md" style={[pal.textLight]}>
                  {pluralizedFollowers}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="communityHeaderFollowsButton"
                style={[s.flexRow, s.mr10]}
                onPress={onPressFollows}
                accessibilityRole="button"
                accessibilityLabel={`${following} following`}
                accessibilityHint={"Opens following list"}
              >
                <Text type="md" style={[s.bold, s.mr2, pal.text]}>
                  {following}
                </Text>
                <Text type="md" style={[pal.textLight]}>
                  following
                </Text>
              </TouchableOpacity>
              <Text type="md" style={[s.bold, pal.text]}>
                {formatCount(view.postsCount)}{" "}
                <Text type="md" style={[pal.textLight]}>
                  {pluralize(view.postsCount, "post")}
                </Text>
              </Text> */}
                </View>
                {sanitizeDisplayName(view.data?.description)}
              </>
            </View>
            {!isDesktopWeb && !hideBackButton && (
              <TouchableWithoutFeedback
                onPress={onPressBack}
                hitSlop={BACK_HITSLOP}
                accessibilityRole="button"
                accessibilityLabel="Back"
                accessibilityHint=""
              >
                <View style={styles.backBtnWrapper}>
                  <BlurView style={styles.backBtn} blurType="dark">
                    <FontAwesomeIcon
                      size={18}
                      icon="angle-left"
                      style={s.white}
                    />
                  </BlurView>
                </View>
              </TouchableWithoutFeedback>
            )}
            <TouchableWithoutFeedback
              testID="communityHeaderAviButton"
              onPress={onPressAvi}
              accessibilityRole="image"
              accessibilityLabel={`View ${view.data.name} Community`}
              accessibilityHint=""
            >
              <View
                style={[
                  pal.view,
                  { borderColor: pal.colors.background },
                  styles.avi,
                ]}
              >
                {/**add image url to type */}
                <UserAvatar size={80} avatar={view.data.image} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </>
    );
  },
);

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    height: 120,
  },
  backBtnWrapper: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    overflow: "hidden",
    borderRadius: 15,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avi: {
    position: "absolute",
    top: 110,
    left: 10,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },

  buttonsLine: {
    flexDirection: "row",
    marginLeft: "auto",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: gradients.purple.start,
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  mainBtn: {
    paddingHorizontal: 24,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
  },
  title: { lineHeight: 38 },

  // Word wrapping appears fine on
  // mobile but overflows on desktop
  handle: isNative
    ? {}
    : {
        // @ts-ignore web only -prf
        wordBreak: "break-all",
      },

  handleLine: {
    flexDirection: "row",
    marginBottom: 8,
  },

  metricsLine: {
    flexDirection: "row",
    marginBottom: 8,
  },

  description: {
    flex: 1,
    marginBottom: 8,
  },

  detailLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  moderationLines: {
    gap: 6,
  },

  moderationNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },

  br40: { borderRadius: 40 },
  br50: { borderRadius: 50 },
});
