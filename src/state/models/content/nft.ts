import { GENESIS_COLLECTION, HELIUS_RPC_API } from "lib/constants";

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
    // const helius = new Helius(process.env.HELIUS_API_KEY ?? '', 'mainnet-beta');
    // console.log('assets_1', helius);
    // const assets = await helius.rpc.searchAssets({ ownerAddress: wallet, compressed: true, page: 1 } );
    // console.log('assets', assets);
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
    this.assets = nftsResponse.result.items;
    //   console.log('nftsResponse', nftsResponse)

    // turn store.reactions.reactionsSets.genesis with a key of title from each reactoin
    const reactionsMap = this.rootStore.reactions.reactionSets.genesis.reduce(
      (acc: { [title: string]: SolarplexReaction }, item: any) => {
        acc[item.title] = item;
        return acc;
      },
      {},
    );

    const reactions = this.assets.reduce((acc, item: any) => {
      // acc.push(item.reactions);
      // console.log('item', item.content.metadata.attributes)
      const attribute = item.content.metadata.attributes[0].value;
      reactionsMap[attribute] && acc.push(reactionsMap[attribute]);
      return acc;
    }, []);
    this.rootStore.reactions.update(reactions);
  }
}
