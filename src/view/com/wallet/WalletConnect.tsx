import { StyleSheet, View } from "react-native";

import { Button } from "../util/forms/Button";
import { Loading } from "../auth/withAuthRequired";
import { MeModel } from "state/models/me";
import { Text } from "../util/text/Text";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { observer } from "mobx-react-lite";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { useWallet } from "@solana/wallet-adapter-react";

export const WalletConnect = observer(({ model }: { model: MeModel }) => {
  const store = useStores();
  const wallet = useWallet();
  const pal = usePalette("default");

  return (
    <>
      {!(store.session.isResumingSession || !store.session.hasAnySession) ? (
        <View>
          {!store.me.splxWallet ? (
            wallet.connected ? (
              <Button
                label="Link Wallet to Solarplex"
                onPress={() =>
                  wallet.publicKey &&
                  store.me.connectWallet(wallet.publicKey?.toString())
                }
              />
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
});