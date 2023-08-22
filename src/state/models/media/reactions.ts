import {
  DEFAULT_REACTION_EMOJIS,
  GENESIS_REACTIONS,
  SOLARPLEX_FEED_API,
  SQUID_REACTION_EMOJIS,
} from "lib/constants";
import { hasProp, isObj } from "lib/type-guards";

import { EmojiItemProp } from "react-native-reactions/lib/components/ReactionView/types";
import { RootStoreModel } from "../root-store";
import { makeAutoObservable } from "mobx";

export interface Reaction {
  post_id: string;
  user_id: string;
  reaction_id: string;
}

export interface SolarplexReaction {
  reaction_id: string;
  collection_id: string;
  id: string;
  nft_metadata: {
    name: string;
    symbol: string;
    image: string;
  }
  project_id: string;
}

// export type ReactionCollections = 'default' | 'squid' | 'genesis';

export class SplxReactionModel {
  // map of posts to reactions
  // postId maps to userId maps to reactionId
  reactionMap: { [postId: string]: { [userId: string]: string } } = {};
  // map of reaction ids to reaction types across collections
  reactionTypes: { [reactionId: string]: SolarplexReaction } = {};
  reactionSets: { [reactionSet: string]: SolarplexReaction[] } = {
    // default: DEFAULT_REACTION_EMOJIS,
    // squid: SQUID_REACTION_EMOJIS,
    // genesis: GENESIS_REACTIONS,
  };
  earnedReactions: { [reactionSet: string]: SolarplexReaction[] } = {
    // default: DEFAULT_REACTION_EMOJIS,
  };
  curReactionsSet: string = "default";

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      { rootStore: false, serialize: false, hydrate: false },
      { autoBind: true },
    );
    // this.reactionMap = {};
    // const emojis = [
    //   ...DEFAULT_REACTION_EMOJIS,
    //   ...SQUID_REACTION_EMOJIS,
    //   ...GENESIS_REACTIONS,
    // ];
    // this.reactionTypes = emojis.reduce(
    //   (acc: { [reactionId: string]: SolarplexReaction }, emoji) => {
    //     acc[emoji.reaction_id] = emoji;
    //     return acc;
    //   },
    //   {},
    // );
  }

  serialize() {
    return {
      curReactionsSet: this.curReactionsSet,
    };
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      let curReactionsSet;
      if (
        hasProp(v, "curReactionsSet") &&
        typeof v.curReactionsSet === "string"
      ) {
        curReactionsSet = v.curReactionsSet;
      }
      if (curReactionsSet) {
        this.curReactionsSet = curReactionsSet;
      }
    }
  }

  async fetch() {
    const reactionPacksRequest = await fetch(
      `${SOLARPLEX_FEED_API}/splx/get_reaction_packs`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "no-cors",
        },
      },
    );
    const reactionPacks = (await reactionPacksRequest.json()).data;
    this.reactionSets = reactionPacks;
    Object.values(reactionPacks).forEach((reactionPack: any) => {
      reactionPack.forEach((reaction: any) => {
        this.reactionTypes[reaction.id] = reaction;
      });
    });
    this.earnedReactions['default'] = reactionPacks["default"]

    const allReactions = await fetch(
      `${SOLARPLEX_FEED_API}/splx/get_all_reactions`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "no-cors",
        },
      },
    );
    for (const reaction of (await allReactions.json()).data as Reaction[]) {
      if (this.reactionMap[reaction.post_id]) {
        this.reactionMap[reaction.post_id][reaction.user_id] =
          reaction.reaction_id;
      } else {
        this.reactionMap[reaction.post_id] = {};
        this.reactionMap[reaction.post_id][reaction.user_id] =
          reaction.reaction_id;
      }
    }
  }

  async update(reactions: SolarplexReaction[]) {
    if (this.rootStore.me.nft.assets.length) {
      this.earnedReactions["genesis"] = reactions;
    }
  }
  async selectReactionSet(reactionSet: string) {
    if (this.reactionSets[reactionSet] && this.reactionSets[reactionSet].length) {
      this.curReactionsSet = reactionSet;
    }
  }
}
