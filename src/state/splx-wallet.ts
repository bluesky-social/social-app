import { makeAutoObservable, runInAction } from "mobx";

import { Json } from "lib/splx-utils/json";
import { RootStoreModel } from "./models/root-store";
import { SOLARPLEX_FEED_API } from "lib/constants";
import { debouncer } from "../lib/splx-utils/functions";
import { md5 } from "../lib/splx-utils/string";
import merge from "lodash.merge";
import { tryEachAnimationFrame } from '../lib/splx-utils/timers';

export interface ModelWalletState {
  did: string;
  walletId: string;
  waitingToConnectWallet: boolean;
  canceledWaitingToConnectWallet: boolean;
  connectedWalletId: string;
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
    did: '',
    waitingToConnectWallet: false,
    walletId: '',
    connectedWalletId: '',
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
      })
      runInAction(() => {
        this.state.waitingToConnectWallet = false;
        this.state.canceledWaitingToConnectWallet = false;
      })
    }, 'waitForWalletConnect', ...arguments); 
  }

  waitForWalletConnectIsBusy() {
    return this._isBusy('waiitForWalletConnect');
  }

  startWaitForWalletConnect() {
    runInAction(() => {
      this.state.waitingToConnectWallet = true;
      this.state.canceledWaitingToConnectWallet = false;
    })
  }

  cancelWaitForWalletConnect() {
    if (!this.waitForWalletConnectIsBusy()) {
      return;
    }
    runInAction(() => {
      this.state.waitingToConnectWallet = false;
      this.state.canceledWaitingToConnectWallet = true;
    })
  }

  setWalletAddress(address: string) {
    runInAction(() => {
      this.state.walletId = address;
    })
  }

  unsetWalletAddress() {
    runInAction(() => {
      this.state.walletId = '';
    })
  }

  async getConnectedWallet() {
    return this._execute(async () => {
      const { user } = await this._feedApiCall(`splx/get_user/${this.rootStore.me.did}`);
      runInAction(() => {
        this.state.connectedWalletId = user?.wallet ?? '';
      })
      return user?.wallet ?? '';
    }, 'getConnectedWallet', this.rootStore.me.did);
  }

  async linkWallet(wallet: string) {
    return this._execute(async () => {
      if (!this.rootStore.session || wallet === this.state.connectedWalletId) {
        return;
      }
      if (this.state.connectedWalletId) {
        await this.unLinkWallet();
      }
      try {
        console.log('linking wallet!');
        await this._feedApiCall('splx/add_wallet_to_user', 'POST', { did: this.rootStore.me.did, wallet });
        const address = await this.getConnectedWallet();
        runInAction(() => {
          this.state.walletId = address;
        });
        
      } catch(err) {};
    }, 'linkWallet', this.rootStore.me.did, wallet);
  }

  async unLinkWallet() {
    this._execute(async () => {
      if (!this.state.walletId) {
        return;
      }
      try {
        this._feedApiCall('splx/remove_wallet_from_user', 'POST', { did: this.rootStore.me.did });
        runInAction(() => {
          this.state.walletId = '';
          this.state.connectedWalletId = '';
        });
      } catch(err) {};
    }, 'unLinkWallet', this.rootStore.me.did, this.state.walletId);
  }

}