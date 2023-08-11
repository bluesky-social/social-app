import "lib/sentry"; // must be relatively on top

import * as analytics from "lib/analytics/analytics";
import * as view from "./view/index";

import {
  BackpackWalletAdapter,
  BraveWalletAdapter,
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  UnsafeBurnerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import React, { useEffect, useMemo, useState } from "react";
import { RootStoreModel, RootStoreProvider, setupState } from "./state";
import {
  WalletDisconnectButton,
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Shell } from "./view/shell/index";
import { Text } from "react-native";
import { ThemeProvider } from "lib/ThemeContext";
import { ToastContainer } from "./view/com/util/Toast.web";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { observer } from "mobx-react-lite";
import { useFonts } from "expo-font";

require("@solana/wallet-adapter-react-ui/styles.css");

const App = observer(() => {
  const [fontsLoaded] = useFonts({
    Manrope: require("../assets/fonts/Manrope.ttf"),
    Chirp: require("../assets/fonts/Chirp-Regular.ttf"),
  });
  const [rootStore, setRootStore] = useState<RootStoreModel | undefined>(
    undefined,
  );
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // init
  useEffect(() => {
    view.setup();
    setupState().then((store) => {
      setRootStore(store);
      analytics.init(store);
    });
  }, []);

  // show nothing prior to init
  if (!rootStore) {
    return null;
  }

  if (!fontsLoaded) {
    return null;
  }

  // const wallets = [
  //   new PhantomWalletAdapter(),
  // new SolflareWalletAdapter(),
  // new BackpackWalletAdapter(),
  // new GlowWalletAdapter(),
  // new BraveWalletAdapter(),
  // ];

  return (
    <ThemeProvider theme={rootStore.shell.colorMode}>
      <RootSiblingParent>
        <analytics.Provider>
          <RootStoreProvider value={rootStore}>
            <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                  <SafeAreaProvider>
                    <Shell />
                  </SafeAreaProvider>
                  <ToastContainer />
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </RootStoreProvider>
        </analytics.Provider>
      </RootSiblingParent>
    </ThemeProvider>
  );
});

export default App;
