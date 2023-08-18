import { useEffect, useState } from 'react';

import { useObserver } from 'mobx-react-lite';
import { useStores } from '../../../state';
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export const useSplxWallet = () => {
  const store = useStores();
  const wallet = useWallet();
  const waitForWalletConnectIsBusy = useObserver(() => store.wallet.waitForWalletConnectIsBusy());
  const waitingToConnectWallet = useObserver(() => store.wallet.state.waitingToConnectWallet);
  const waitingToConnectWalletCanceled = useObserver(() => store.wallet.state.canceledWaitingToConnectWallet);
  const walletAddressFromWalletConnect = useObserver(() => wallet.publicKey?.toBase58() ?? '');
  const walletAddressFromModel = useObserver(() => store.wallet.state.walletId);
  const linkedWallet = useObserver(() => store.wallet.state.connectedWalletId);

  const { setVisible, visible } = useWalletModal();
  useEffect(() => {
    if (!visible && waitForWalletConnectIsBusy && !waitingToConnectWallet && !waitingToConnectWalletCanceled) {
      setVisible(true);
    } else if (visible && waitForWalletConnectIsBusy && !waitingToConnectWallet && !waitingToConnectWalletCanceled) {
      void store.wallet.startWaitForWalletConnect();
    } else if (
      !visible &&
      !wallet.connecting &&
      waitForWalletConnectIsBusy &&
      waitingToConnectWallet &&
      !waitingToConnectWalletCanceled
    ) {
      store.wallet.cancelWaitForWalletConnect();
    }
  }, [waitForWalletConnectIsBusy, waitingToConnectWallet, visible, waitingToConnectWalletCanceled, wallet.connecting]);

  useEffect(() => {
    if (walletAddressFromWalletConnect !== walletAddressFromModel) {
      store.wallet.setWalletAddress(walletAddressFromWalletConnect);
      void store.wallet.linkWallet(walletAddressFromWalletConnect);
    }
  }, [walletAddressFromWalletConnect])

  return [visible, setVisible, linkedWallet] as [boolean, typeof setVisible, typeof linkedWallet];
};