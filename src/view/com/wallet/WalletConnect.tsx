import * as Toast from "../util/Toast";
import * as fa from "@fortawesome/free-solid-svg-icons";

import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from "@fortawesome/react-native-fontawesome";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { colors, s } from "lib/styles";

import { Button } from "../util/forms/Button";
import { Link } from "../util/Link";
import { Loading } from "../auth/withAuthRequired";
import { MeModel } from "state/models/me";
import { Text } from "../util/text/Text";
import { UserAvatar } from "../util/UserAvatar";
import { observer } from "mobx-react-lite";
import { usePalette } from "lib/hooks/usePalette";
import { useSplxWallet } from "./useSplxWallet";
import { useStores } from "state/index";

export const WalletConnect = observer(function WalletConnect() {
  const store = useStores();
  const [visible, setVisible, linkedWallet, connectedWallet, connectWalletIsBusy, disconnectWalletIsBusy] = useSplxWallet();
  const pal = usePalette("default");

  const handleLinkWallet = async () => {
    if (connectedWallet) {
      await store.wallet.linkWallet(connectedWallet);
      Toast.show("Wallet Connected");
    } else {
      Toast.show("No Wallet Connection Found");
    }
  };

  const disconnectWallet = async () => {
    await store.wallet.unlinkWallet();
    Toast.show("Wallet Disconnected");
  };

  return (
    <>
      {!(store.session.isResumingSession || !store.session.hasAnySession) ? (
        <View>
          {!store.me.splxWallet ? (
            connectedWallet ? (
              <>
                <View style={[styles.infoLine]}>
                  <Link
                    href={`/profile/${store.me.handle}`}
                    title="Your profile"
                    noFeedback
                  >
                    <View style={[pal.view, styles.linkCard]}>
                      <View style={styles.avi}>
                        <View style={[styles.iconContainer, pal.btn]}>
                          <FontAwesomeIcon
                            size={20}
                            icon={fa.faWallet}
                            style={
                              {
                                ...pal.text,
                                marginLeft: 4,
                              } as FontAwesomeIconStyle
                            }
                          />
                        </View>
                      </View>
                      <View style={[s.flex1]}>
                        <Text type="md-bold" style={pal.text} numberOfLines={1}>
                          {connectedWallet.slice(0, 5)}...
                          {connectedWallet.slice(-5)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        testID="linkWalletBtn"
                        onPress={handleLinkWallet}
                        accessibilityRole="button"
                        accessibilityLabel="Link Wallet"
                        disabled={connectWalletIsBusy}
                        accessibilityHint={`Signs ${store.me.displayName} out of Solarplex`}
                      >
                        <Text type="lg" style={pal.link}>
                          { connectWalletIsBusy ? 'Linking...' : 'Link Wallet' }
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
                disabled={connectWalletIsBusy}
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
                  { connectWalletIsBusy ? 'Connecting...' : 'Connect Wallet' }
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
                      <View style={[styles.iconContainer, pal.btn]}>
                        <FontAwesomeIcon
                          size={20}
                          icon={fa.faWallet}
                          style={
                            {
                              ...pal.text,
                              marginLeft: 4,
                            } as FontAwesomeIconStyle
                          }
                        />
                      </View>
                    </View>
                    <View style={[s.flex1]}>
                      <Text type="md-bold" style={pal.text} numberOfLines={1}>
                        {store.me.splxWallet.slice(0, 5)}...
                        {store.me.splxWallet.slice(-5)}
                      </Text>
                      {/* <Text type="sm" style={pal.textLight} numberOfLines={1}>
                        {store.me.splxWallet.slice(0, 5)}...
                        {store.me.splxWallet.slice(-5)}
                      </Text> */}
                    </View>
                    <TouchableOpacity
                      testID="DisconnectWalletBtn"
                      onPress={disconnectWallet}
                      accessibilityRole="button"
                      accessibilityLabel="Disconnect Wallet"
                      accessibilityHint={`Disconnects ${store.me.displayName} out of Solarplex`}
                      disabled={disconnectWalletIsBusy}
                    >
                      <Text type="lg" style={pal.link}>
                        { disconnectWalletIsBusy ? 'Disconnecting...' : 'Disconnect Wallet'}
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
