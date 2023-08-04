import { StyleSheet, TouchableOpacity, View } from "react-native";

import { DesktopSearch } from "./Search";
import { FEEDBACK_FORM_URL } from "lib/constants";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import React from "react";
import { RewardsCardSidebar } from "view/com/rewards/RewardsCardSidebar";
import { Text } from "view/com/util/text/Text";
import { TextLink } from "view/com/util/Link";
import { formatCount } from "view/com/util/numeric/format";
import { observer } from "mobx-react-lite";
import { pluralize } from "lib/strings/helpers";
import { s } from "lib/styles";
import { useNavigationTabState } from "lib/hooks/useNavigationTabState.web";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";

export const DesktopRightNav = observer(function DesktopRightNav() {
  const store = useStores();
  const pal = usePalette("default");
  const palError = usePalette("error");
  const { isAtRewards } = useNavigationTabState();
  const did = store.session?.currentSession?.did ?? "";

  return (
    <View style={[styles.rightNav, pal.view]}>
      {/* {store.session.hasSession && <DesktopSearch />} */}
      <View style={styles.message}>
        {/* {store.session.isSandbox ? (
          <View style={[palError.view, styles.messageLine, s.p10]}>
            <Text type="md" style={[palError.text, s.bold]}>
              SANDBOX. Posts and accounts are not permanent.
            </Text>
          </View>
        ) : (
          <Text type="md" style={[pal.textLight, styles.messageLine]}>
            Welcome to Bluesky! This is a beta application that's still in
            development.
          </Text>
        )} */}

        {isAtRewards ? null : <RewardsCardSidebar userId={did} />}
        <View style={[s.flexRow, { paddingHorizontal: 6 }]}>
          <TextLink
            type="md"
            style={pal.link}
            href={"https://tally.so/r/nrD8l2"}
            text="feedback"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="https://usedispatch.notion.site/Terms-d0b533a2a7f04c0eaea58440dbea5896?pvs=4"
            text="Terms"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="https://t.co/SLPiY47mjg"
            text="help"
          />
          <Text type="md" style={pal.textLight}>
            &nbsp;&middot;&nbsp;
          </Text>
          <TextLink
            type="md"
            style={pal.link}
            href="https://usedispatch.notion.site/Privacy-0c34aa8d5fd34b52b4c742380addc03e?pvs=4"
            text="privacy"
          />
        </View>
      </View>
      {/* <InviteCodes /> */}
    </View>
  );
});

const InviteCodes = observer(() => {
  const store = useStores();
  const pal = usePalette("default");

  const { invitesAvailable } = store.me;

  const onPress = React.useCallback(() => {
    store.shell.openModal({ name: "invite-codes" });
  }, [store]);
  return (
    <TouchableOpacity
      style={[styles.inviteCodes, pal.border]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        invitesAvailable === 1
          ? "Invite codes: 1 available"
          : `Invite codes: ${invitesAvailable} available`
      }
      accessibilityHint="Opens list of invite codes"
    >
      <FontAwesomeIcon
        icon="ticket"
        style={[
          styles.inviteCodesIcon,
          store.me.invitesAvailable > 0 ? pal.link : pal.textLight,
        ]}
        size={16}
      />
      <Text
        type="md-medium"
        style={store.me.invitesAvailable > 0 ? pal.link : pal.textLight}
      >
        {formatCount(store.me.invitesAvailable)} invite{" "}
        {pluralize(store.me.invitesAvailable, "code")} available
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  rightNav: {
    position: "absolute",
    top: 20,
    left: "calc(50vw + 310px)",
    width: 304,
  },

  message: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  messageLine: {
    marginBottom: 10,
  },

  inviteCodes: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  inviteCodesIcon: {
    marginRight: 6,
  },
});
