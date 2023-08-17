import * as Toast from "../util/Toast";
import * as fa from "@fortawesome/free-solid-svg-icons";

import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  WalletMultiButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { colors, s } from "lib/styles";

import { Button } from "../util/forms/Button";
import { Link } from "../util/Link";
import { Loading } from "../auth/withAuthRequired";
import { MeModel } from "state/models/me";
import { Text } from "../util/text/Text";
import { UserAvatar } from "../util/UserAvatar";
import { observer } from "mobx-react-lite";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { useWallet } from "@solana/wallet-adapter-react";

export const WalletConnect = observer(() => {
  const store = useStores();
  const wallet = useWallet();
  const pal = usePalette("default");
  const { setVisible } = useWalletModal();

  console.log("this.splxWallet", store.me.splxWallet);

  const handleLinkWallet = async () => {
    if (wallet.publicKey) {
      await store.me.connectWallet(wallet.publicKey?.toString());
      Toast.show("Wallet Connected");
    } else {
      Toast.show("No Wallet Connection Found");
    }
  };

  const disconnectWallet = async () => {
    await store.me.disconnectWallet();
    Toast.show("Wallet Disconnected");
  };

  return (
    <>
      {!(store.session.isResumingSession || !store.session.hasAnySession) ? (
        <View>
          {!store.me.splxWallet ? (
            wallet.connected ? (
              <>
                <View style={[styles.infoLine]}>
                  <Link
                    href={`/profile/${store.me.handle}`}
                    title="Your profile"
                    noFeedback
                  >
                    <View style={[pal.view, styles.linkCard]}>
                      <View style={styles.avi}>
                        <UserAvatar size={40} avatar={store.me.avatar} />
                      </View>
                      <View style={[s.flex1]}>
                        <Text type="md-bold" style={pal.text} numberOfLines={1}>
                          {store.me.displayName || store.me.handle}
                        </Text>
                        <Text type="sm" style={pal.textLight} numberOfLines={1}>
                          {store.me.handle}
                        </Text>
                      </View>
                      <TouchableOpacity
                        testID="linkWalletBtn"
                        onPress={handleLinkWallet}
                        accessibilityRole="button"
                        accessibilityLabel="Link Wallet"
                        accessibilityHint={`Signs ${store.me.displayName} out of Solarplex`}
                      >
                        <Text type="lg" style={pal.link}>
                          Link Wallet
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Link>
                </View>
                <View style={styles.spacer20} />
              </>
            ) : (
              <TouchableOpacity
                testID="ConnectWallet"
                style={[styles.linkCard, pal.view]}
                onPress={() => setVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Connect  Wallet"
                accessibilityHint="Wallet Connect Button"
              >
                <View style={[styles.iconContainer, pal.btn]}>
                  <FontAwesomeIcon
                    size={20}
                    icon={fa.faWallet}
                    style={
                      { ...pal.text, marginLeft: 4 } as FontAwesomeIconStyle
                    }
                  />
                </View>
                <Text type="lg" style={pal.text}>
                  Connect Wallet
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <>
              <View>
                <Link
                  href={`/profile/${store.me.handle}`}
                  title="Your profile"
                  noFeedback
                >
                  <View style={[pal.view, styles.linkCard]}>
                    <View style={styles.avi}>
                      <UserAvatar size={40} avatar={store.me.avatar} />
                    </View>
                    <View style={[s.flex1]}>
                      <Text type="md-bold" style={pal.text} numberOfLines={1}>
                        {store.me.displayName || store.me.handle}
                      </Text>
                      <Text type="sm" style={pal.textLight} numberOfLines={1}>
                        {store.me.splxWallet.slice(0, 5)}...
                        {store.me.splxWallet.slice(-5)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      testID="DisconnectWalletBtn"
                      onPress={disconnectWallet}
                      accessibilityRole="button"
                      accessibilityLabel="Disconnect Wallet"
                      accessibilityHint={`Disconnects ${store.me.displayName} out of Solarplex`}
                    >
                      <Text type="lg" style={pal.link}>
                        Disconnect Wallet
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Link>
              </View>
              <View style={styles.spacer20} />
            </>
          )}
        </View>
      ) : (
        <Loading />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  avi: {
    marginRight: 12,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 12,
  },
  heading: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  infoLine: {
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  spacer20: {
    height: 20,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: colors.splx.primary[50],

    marginTop: 4,
    marginBottom: 4,
  },
});
