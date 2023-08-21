import { GENESIS_COLLECTION, HELIUS_RPC_API } from "lib/constants";
import { makeAutoObservable, runInAction } from "mobx";

import { RootStoreModel } from "../root-store";
import { SolarplexReaction } from "../media/reactions";
import cluster from "cluster";

export class NftModel {
  assets: any[] = [];

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      { rootStore: false, serialize: false, hydrate: false },
      { autoBind: true },
    );
  }

  setAssets(assets: any) {
    // turn store.reactions.reactionsSets.genesis with a key of title from each reactoin
    const reactionsMap = this.rootStore.reactions.reactionSets.genesis.reduce(
      (acc: { [title: string]: SolarplexReaction }, item: any) => {
        acc[item.reaction_id] = item;
        return acc;
      },
      {},
    );

    const reactions: SolarplexReaction[] = [];
    const seenAttributes = new Set();

    assets.forEach((item: any) => {
      // console.log("item", item, item?.content?.metadata);
      const metadata = item?.content?.metadata;
      if (!metadata.attributes) return;
      const attribute = item?.content?.metadata?.attributes[0]?.value;
      if (!seenAttributes.has(attribute)) {
        seenAttributes.add(attribute);
        reactionsMap[attribute] && reactions.push(reactionsMap[attribute]);
      }
    });

    runInAction(() => {
      this.assets = assets;
    });

    this.rootStore.reactions.update(reactions);
  }

  async _fetchNfts(wallet: string) {
    if (!wallet) return;
    try {
      const res = await fetch(
        `${HELIUS_RPC_API}/?api-key=${process.env.HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "searchAssets",
            id: "solarplex",
            params: {
              ownerAddress: wallet,
              compressed: true,
              grouping: ["collection", GENESIS_COLLECTION],
              page: 1,
            },
          }),
        },
      );
      return await res.json();
    } catch (e) {
      console.log("error fetching nfts", e);
    }
  }

  fetchNfts(wallet: string) {
    this._fetchNfts(wallet).then((response) => this.setAssets(response.result.items));
  }

}
