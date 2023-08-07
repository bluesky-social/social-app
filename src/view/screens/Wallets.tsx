import {
  CommonNavigatorParams,
  NativeStackScreenProps,
} from "lib/routes/types";
import React, { useMemo } from "react";
import { Touchable, TouchableOpacity, View } from "react-native";

import { CenteredView } from "view/com/util/Views";
import { MeModel } from "state/models/me";
import { Text } from "view/com/util/text/Text";
import { ViewHeader } from "../com/util/ViewHeader";
import { WalletConnect } from "view/com/wallet/WalletConnect";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useFocusEffect } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type Props = NativeStackScreenProps<CommonNavigatorParams, "Wallets">;
export const Wallets = observer((_props: Props) => {
  const store = useStores();
  const pal = usePalette("default");
  const meModel = useMemo(() => new MeModel(store), [store]);
  const { setVisible } = useWalletModal();

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false);
    }, [store]),
  );

  return (
    <View>
      <ViewHeader title="Wallets" />
      <CenteredView>
        <Text type="title-xl" style={[pal.text, s.p20, s.pb5]}>
          Wallets
        </Text>
        <WalletConnect model={meModel} />
      </CenteredView>
    </View>
  );
});
