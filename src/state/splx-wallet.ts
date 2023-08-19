import { makeAutoObservable, runInAction } from "mobx";

import { Json } from "lib/splx-utils/json";
import { RootStoreModel } from "./models/root-store";
import { SOLARPLEX_FEED_API } from "lib/constants";
import { debouncer } from "../lib/splx-utils/functions";
import { md5 } from "../lib/splx-utils/string";
import merge from "lodash.merge";
import { tryEachAnimationFrame } from '../lib/splx-utils/timers';

export interface ModelWalletState {
  walletId: string;
  waitingToConnectWallet: boolean;
  canceledWaitingToConnectWallet: boolean;
  connectedWallets: { [did: string]: string }
}

enum ActionStatus {
  Loading = 'loading',
  Busy = 'busy',
  Error = 'error',
  Idle = 'idle',
  New = 'new',
}

interface ActionState {
  key: string;
  status: ActionStatus;
}

interface Actions {
  [id: string]: ActionState;
}

interface ActionStatePayload {
  status: ActionStatus;
  error?: Error;
  key?: string;
}


function getInitialState(): ModelWalletState {
  return {
    canceledWaitingToConnectWallet: false,
    waitingToConnectWallet: false,
    walletId: '',
    connectedWallets: {}
  };
}

function getActionKeyFromPayload(...args: any[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i]?.storeActionKey) {
      return args[i]?.storeActionKey;
    }
  }
}

function getKeyPrefix<P, C, G, A>(fnName: string) {
  return `Wallet/${fnName}`;
}

function getPayloadString<P, C, G, A>(...args: any[]): string {
  const str = getActionKeyFromPayload(...args) ?? JSON.stringify(args ?? '');
  return str;
}

function payloadToKey(fnName: string, ...args: any[]) {
  const prefix = getKeyPrefix(fnName);
  const payloadStr = getPayloadString(...args);
  const hash = payloadStr.length > 512 ? md5(payloadStr) : payloadStr;
  if (!hash) {
    return prefix;
  }
  return `${prefix}#${hash}`;
}

export class SplxWallet {

  state: ModelWalletState = getInitialState()

  actions: Actions = {};

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      { autoBind: true },
    );
  }

  get connectedWallet(): string {
    if (!this.rootStore.me.did) {
      return '';
    }
    return this.state.connectedWallets[this.rootStore.me.did];
  }

  async _feedApiCall(subDir: string, method: string = 'GET', body?: Json) {
    return this._execute(async () => {
      if (!subDir.startsWith('/')) {
        subDir = `/${subDir}`;
      }
      try {
        const bodyStr = body ? JSON.stringify(body) : '';
        const requestInit: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        }
        if (bodyStr) {
          requestInit.body = bodyStr;
        }
        const response = await fetch(`${SOLARPLEX_FEED_API}${subDir}`, requestInit);

        if (!response.ok) {
          throw new Error(`feedApiCallFailed_${subDir}_${bodyStr}`)
        }
        return await response.json();
      } catch(err) {
        console.error(`apiFeedError`, err);
        throw err;
      }
    }, '_feedApiCall', subDir, body);
  }

  _maybeCreateActionStateAndReturnKey(fnName: string, ...args: any[]) {
    const key = payloadToKey(fnName, ...args);
    if (!this.actions[key]) {
      runInAction(() => {
        this.actions[key] = {
          key,
          status: ActionStatus.New,
        }
      })
    }
    return key;
  }

  _setActionState({ status, key }: ActionStatePayload, fnName: string, ...args: any[]) {
    const stateKey = (key ?? this._maybeCreateActionStateAndReturnKey(fnName, ...args)) as string;
    runInAction(() => {
      const currentState = {...this.actions[stateKey]};
      currentState.status = status;
      this.actions[stateKey] = merge(this.actions[stateKey], currentState);
    });
  }

  _setBusy(fnName: string, ...args: any[]) {
    const key = this._maybeCreateActionStateAndReturnKey(fnName, ...args);
    const currentStatus = this.actions[key].status;
    this._setActionState({ 
      key,
      status: currentStatus === ActionStatus.New ? ActionStatus.Loading : ActionStatus.Busy,
    }, fnName, ...args)
  }

  _setIdle(fnName: string, ...args: any[]) {
    const key = this._maybeCreateActionStateAndReturnKey(fnName, ...args);
    const currentStatus = this.actions[key].status;
    if (currentStatus === ActionStatus.New) {
      return;
    }
    this._setActionState({ 
      key,
      status: ActionStatus.Idle,
    }, fnName, ...args)
  }

  _setError(error: Error, fnName: string, ...args: any[]) {
    const key = this._maybeCreateActionStateAndReturnKey(fnName, ...args);
    this._setActionState({ 
      error,
      key,
      status: ActionStatus.Error,
    }, fnName, ...args)
  }

  _isBusy(fnName: string, ...args: any[]) {
    const key = this._maybeCreateActionStateAndReturnKey(fnName, ...args);
    const currentStatus = this.actions[key].status;
    return currentStatus === ActionStatus.Busy || currentStatus === ActionStatus.Loading;
  }

  async _execute<T>(fn: (...args: any[]) => Promise<T>, fnName: string, ...args: any[]) {
    return await debouncer.execute(async () => {
      this._setBusy(fnName, ...args);
      try {
        const r = await fn(...args);
        this._setIdle(fnName, ...args);
        return r;
      } catch (err) {
        console.error('error in', getKeyPrefix(fnName), err);
        this._setError(err as Error, fnName, ...args);
        throw err;
      }
    }, payloadToKey(fnName, ...args));
  }

  async waitForWalletConnect() {
    return this._execute(async () => {
      await tryEachAnimationFrame(() => {
        return !!this.state.walletId || this.state.canceledWaitingToConnectWallet;
      }, 86400 * 1000)
      runInAction(() => {
        this.state.waitingToConnectWallet = false;
        this.state.canceledWaitingToConnectWallet = false;
      })
    }, 'waitForWalletConnect'); 
  }

  waitForWalletConnectIsBusy() {
    return this._isBusy('waitForWalletConnect');
  }

  startWaitForWalletConnect() {
    runInAction(() => {
      this.state.waitingToConnectWallet = true;
      this.state.canceledWaitingToConnectWallet = false;
    })
  }

  cancelWaitForWalletConnect() {
    runInAction(() => {
      this.state.waitingToConnectWallet = false;
      this.state.canceledWaitingToConnectWallet = true;
    })
  }

  setWalletAddress(address: string) {
    runInAction(() => {
      this.state.walletId = address ?? '';
    })
  }

  unsetWalletAddress() {
    runInAction(() => {
      this.state.walletId = '';
    })
  }

  async getConnectedWallet() {
    return this._execute(async () => {
      const did = this.rootStore.me.did;
      const { user } = await this._feedApiCall(`splx/get_user/${did}`);
      runInAction(() => {
        this.state.connectedWallets[did] = user?.wallet ?? '';
      })
      return user?.wallet ?? '';
    }, 'getConnectedWallet', this.rootStore.me.did);
  }

  linkWalletIsBusy(wallet: string) {
    return this._isBusy('linkWallet', this.rootStore.me.did, wallet);
  }

  async linkWallet(wallet: string) {
    return this._execute(async () => {
      if (!this.rootStore.session || wallet === this.connectedWallet) {
        return;
      }
      if (this.connectedWallet) {
        await this.unlinkWallet();
      }
      try {
        await this._feedApiCall('splx/add_wallet_to_user', 'POST', { did: this.rootStore.me.did, wallet });
        const address = await this.getConnectedWallet();
        runInAction(() => {
          this.state.walletId = address;
        });
        this.rootStore.me.nft.fetchNfts(this.rootStore.wallet.connectedWallet);
      } catch(err) {};
    }, 'linkWallet', this.rootStore.me.did, wallet);
  }

  unlinkWalletIsBusy() {
    return this._isBusy('unlinkWallet', this.rootStore.me.did);
  }

  async unlinkWallet() {
    return await this._execute(async () => {
      if (!this.connectedWallet) {
        return;
      }
      try {
        const did = this.rootStore.me.did;
        await this._feedApiCall('splx/remove_wallet_from_user', 'POST', { did });
        const address = await this.getConnectedWallet();
        runInAction(() => {
          this.state.connectedWallets[did] = address ?? '';
        });
        this.rootStore.me.nft.setAssets([]);
      } catch(err) {};
    }, 'unlinkWallet', this.rootStore.me.did);
  }

}