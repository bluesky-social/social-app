import * as Toast from "view/com/util/Toast";

import {
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { AtUri } from "@atproto/api";
import { CommunityFeedModel } from "state/models/feeds/community-feed";
import { CustomFeedModel } from "state/models/feeds/custom-feed";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { NavigationProp } from "lib/routes/types";
import React from "react";
import { SolarplexCommunity } from "lib/splx-types";
import { Text } from "../util/text/Text";
import { UserAvatar } from "../util/UserAvatar";
import { observer } from "mobx-react-lite";
import { pluralize } from "lib/strings/helpers";
import { s } from "lib/styles";
import { useNavigation } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";

export const CommunityFeed = observer(
  ({
    item,
    style,
    showJoinBtn = false,
    showDescription = true,
  }: {
    item: CommunityFeedModel;
    style?: StyleProp<ViewStyle>;
    showJoinBtn?: boolean;
    showDescription?: boolean;
  }) => {
    const store = useStores();
    const pal = usePalette("default");
    const navigation = useNavigation<NavigationProp>();
    const onToggleJoined = React.useCallback(async () => {
      if (store.session.isSolarplexSession) {
        navigation.navigate("SignIn");
        return;
      }
      console.log("item:", item);
      // TODO(viksit)[F1]: add a store.me.joinedCommunities
      // then check for this
      if (item.isJoined) {
        store.shell.openModal({
          name: "confirm",
          title: "Remove from my communities",
          message: `Remove ${item.displayName} from my communities?`,
          onPressConfirm: async () => {
            try {
              await store.me.joinedCommunities.leave(item);
              Toast.show("Removed from my communities");
            } catch (e) {
              Toast.show("There was an issue contacting your server");
              store.log.error("Failed to unsave communities", { e });
            }
          },
        });
      } else {
        try {
          await store.me.joinedCommunities.join(item);
          Toast.show("Added to my communities");
          await item.reload();
        } catch (e) {
          Toast.show("There was an issue contacting your server");
          store.log.error("Failed to save community", { e });
        }
      }
    }, [store, item, navigation]);

    // store.log.debug('item.displayName', item)
    // console.log("item.displayName", item.displayName);
    // console.log("item.displayName", item.data);

    // TODO(viksit)[F1]: get avatar from server not hardcoded here
    const avatar =
      "https://cdn.bsky.social/imgproxy/29tGuFZEOtTYMs9vp-rG2w3aTstYFvWsvienwFDTDgg/rs:fill:1000:1000:1:0/plain/bafkreidfbgdswcssmcjtzo5dmezyyurljn5trlcbfbvnpwl7q3am6yxbdy@jpeg";

    return (
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.container, pal.border, style]}
        onPress={() => {
          // TODO(viksit)[f1]: create community feed
          navigation.push("CommunityFeed", {
            name: item.data.name,
            rkey: item.id,
          });
        }}
        key={item.id}
      >
        <View style={[styles.headerContainer]}>
          <View style={[s.mr10]}>
            <UserAvatar type="algo" size={36} avatar={avatar} />
          </View>
          <View style={[styles.headerTextContainer]}>
            <Text style={[pal.text, s.bold]} numberOfLines={3}>
              {item.data.name}
            </Text>
            <Text style={[pal.textLight]} numberOfLines={3}>
              by @Solarplex
            </Text>
          </View>
          {showJoinBtn && (
            <View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  item.isJoined ? "Leave community" : "Join community"
                }
                onPress={onToggleJoined}
                hitSlop={15}
                style={styles.btn}
              >
                {item.isJoined ? (
                  <FontAwesomeIcon
                    icon={["far", "trash-can"]}
                    size={19}
                    color={pal.colors.icon}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon="plus"
                    size={18}
                    color={pal.colors.link}
                  />
                )}
              </Pressable>
            </View>
          )}
        </View>

        {showDescription && item.data.description ? (
          <Text style={[pal.textLight, styles.description]} numberOfLines={3}>
            {item.data.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: "column",
    flex: 1,
    borderTopWidth: 1,
    gap: 14,
  },
  headerContainer: {
    flexDirection: "row",
  },
  headerTextContainer: {
    flexDirection: "column",
    columnGap: 4,
    flex: 1,
  },
  description: {
    flex: 1,
    flexWrap: "wrap",
  },
  btn: {
    paddingVertical: 6,
  },
});
