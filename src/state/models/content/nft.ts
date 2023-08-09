import {
  DEVNET_HELIUS_RPC_API,
  GENESIS_COLLECTION,
  HELIUS_RPC_API,
} from "lib/constants";

import { Helius } from "helius-sdk";
import { RootStoreModel } from "../root-store";
import { SolarplexReaction } from "../media/reactions";
import cluster from "cluster";
import { makeAutoObservable } from "mobx";

export class NftModel {
  assets: any[] = [];

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      { rootStore: false, serialize: false, hydrate: false },
      { autoBind: true },
    );
  }

  async fetchNfts(wallet: string) {
    try {
      console.log("IN Fetch", wallet);
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
      const nftsResponse = await res.json();
      console.log("nftsResponse", nftsResponse);
      this.assets = nftsResponse.result.items;

      // turn store.reactions.reactionsSets.genesis with a key of title from each reactoin
      const reactionsMap = this.rootStore.reactions.reactionSets.genesis.reduce(
        (acc: { [title: string]: SolarplexReaction }, item: any) => {
          acc[item.title] = item;
          return acc;
        },
        {},
      );

      console.log("reactionsMap", reactionsMap);

      const reactions = this.assets.reduce((acc, item: any) => {
        const attribute = item.content.metadata.attributes[0].value;
        console.log("attribute", attribute);
        reactionsMap[attribute] && acc.push(reactionsMap[attribute]);

        return acc;
      }, []);

      console.log("reactions", reactions);
      if (reactions.length > 0) {
        this.rootStore.reactions.update(reactions);
      }
    } catch (e) {
      console.log("error fetching nfts", e);
    }
  }
}
