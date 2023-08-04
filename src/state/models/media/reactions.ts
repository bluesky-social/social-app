import { DEFAULT_REACTION_EMOJIS, GENESIS_REACTIONS, SOLARPLEX_FEED_API, SQUID_REACTION_EMOJIS } from "lib/constants";

import { EmojiItemProp } from "react-native-reactions/lib/components/ReactionView/types";
import { RootStoreModel } from "../root-store";
import { SolarplexReactionType } from "view/com/util/post-ctrls/PostCtrls";
import { makeAutoObservable } from "mobx";

export interface Reaction {
    post_id: string;
    user_id: string;
    reaction_id: string;
}

export class SplxReactionModel {
    // map of posts to reactions
    // postId maps to userId maps to reactionId
    reactionMap: { [postId: string]: { [userId: string]: string} } = {}
    // map of reaction ids to reaction types across collections
    reactionTypes: { [reactionId: string]: SolarplexReactionType } = {}
    reactionSets: {[reactionSet: string] :  EmojiItemProp[]} = { default: DEFAULT_REACTION_EMOJIS, squid: SQUID_REACTION_EMOJIS };
    reactionsSet = this.reactionSets.default;

    constructor(public rootStore: RootStoreModel) {
      makeAutoObservable(
        this,
        {rootStore: false, serialize: false, hydrate: false},
        {autoBind: true},
      )
        this.reactionMap = {}
        const emojis = [...DEFAULT_REACTION_EMOJIS, ...SQUID_REACTION_EMOJIS, ...GENESIS_REACTIONS]
        this.reactionTypes = emojis.reduce((acc: { [reactionId: string]: SolarplexReactionType }, emoji) => {
          acc[emoji.reaction_id] = emoji
          return acc
        }, {}) 
        console.log('reaction types', this.reactionTypes) 
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
            this.reactionMap[reaction.post_id][reaction.user_id] = reaction.reaction_id
        } else {
            this.reactionMap[reaction.post_id] = {}
            this.reactionMap[reaction.post_id][reaction.user_id] = reaction.reaction_id
        }

    }
      // console.log("reaction map", this.reactionMap);
    }

    async update() {
      if (this.rootStore.me.nft.assets.length) {
        this.reactionSets['genesis'] = GENESIS_REACTIONS
      }
      console.log('reactions_', this.reactionSets)
    }
    async selectReactionSet(reactionSet: string) {
      this.reactionsSet = this.reactionSets[reactionSet]
    }
}