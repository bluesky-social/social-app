import * as Toast from "../util/Toast";

import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Button } from "../util/forms/Button";
import { Loading } from "../auth/withAuthRequired";
import { MeModel } from "state/models/me";
import { Text } from "../util/text/Text";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { colors } from "lib/styles";
import { observer } from "mobx-react-lite";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { useWallet } from "@solana/wallet-adapter-react";

export const WalletConnect = observer(function WalletConnect({
  model,
}: {
  model: MeModel;
}) {
  const store = useStores();
  const wallet = useWallet();
  const pal = usePalette("default");

  const handleLinkWallet = async () => {
    if (wallet.publicKey) {
      await store.me.connectWallet(wallet.publicKey?.toString());
      Toast.show("Wallet Connected");
    } else {
      Toast.show("No Wallet Connection Found");
    }
  };

  return (
    <>
      {!(store.session.isResumingSession || !store.session.hasAnySession) ? (
        <View>
          {!store.me.splxWallet ? (
            wallet.connected ? (
              <>
                <TouchableOpacity
                  onPress={handleLinkWallet}
                  style={styles.connectBtn}
                >
                  <Text
                    type="lg-medium"
                    style={{
                      color: colors.white,
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    Link Wallet to Solarplex
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <WalletMultiButton />
            )
          ) : (
            <>
              <Text type="xl-bold" style={[pal.text, styles.heading]}>
                Wallet
              </Text>
              <View style={[styles.infoLine]}>
                <Text type="lg-medium" style={pal.text}>
                  Address:{" "}
                  <Text type="lg" style={pal.text}>
                    {store.me.splxWallet}
                  </Text>
                </Text>
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
