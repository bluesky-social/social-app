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

export interface SolarplexReaction extends EmojiItemProp {
  reaction_id: string;
}

export type ReactionCollections = 'default' | 'squid' | 'genesis';

export class SplxReactionModel {
  // map of posts to reactions
  // postId maps to userId maps to reactionId
  reactionMap: { [postId: string]: { [userId: string]: string } } = {};
  // map of reaction ids to reaction types across collections
  reactionTypes: { [reactionId: string]: SolarplexReaction } = {};
  reactionSets: { [reactionSet: string]: SolarplexReaction[] } = {
    default: DEFAULT_REACTION_EMOJIS,
    squid: SQUID_REACTION_EMOJIS,
    genesis: GENESIS_REACTIONS,
  };
  earnedReactions: { [reactionSet: string]: SolarplexReaction[] } = {
    default: DEFAULT_REACTION_EMOJIS,
  };
  curReactionsSet: ReactionCollections = "default";

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      { rootStore: false, serialize: false, hydrate: false },
      { autoBind: true },
    );
    this.reactionMap = {};
    const emojis = [
      ...DEFAULT_REACTION_EMOJIS,
      ...SQUID_REACTION_EMOJIS,
      ...GENESIS_REACTIONS,
    ];
    this.reactionTypes = emojis.reduce(
      (acc: { [reactionId: string]: SolarplexReaction }, emoji) => {
        acc[emoji.reaction_id] = emoji;
        return acc;
      },
      {},
    );
    console.log("reaction types", this.reactionTypes);
  }

  serialize() {
    console.log("serializing reactions");
    return {
      curReactionsSet: this.curReactionsSet,
    };
  }

  hydrate(v: unknown) {
    console.log("hydrating reactions");
    if (isObj(v)) {
      let curReactionsSet;
      if (
        hasProp(v, "curReactionsSet") &&
        typeof v.curReactionsSet === "string"
      ) {
        curReactionsSet = v.curReactionsSet;
      }
      if (this.curReactionsSet) {
        this.curReactionsSet = curReactionsSet;
      }
    }
  }

  async fetch() {
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
    // console.log("reaction map", this.reactionMap);
  }

  async update(reactions: SolarplexReaction[]) {
    if (this.rootStore.me.nft.assets.length) {
      this.earnedReactions["genesis"] = reactions;
    }
  }
  async selectReactionSet(reactionSet: ReactionCollections) {
    if (this.reactionSets[reactionSet] && this.reactionSets[reactionSet].length) {
      this.curReactionsSet = reactionSet;
    }
        console.log('reactionsSet', this.curReactionsSet)

  }
}
