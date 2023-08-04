/**
 * This is a temporary client-side system for storing muted threads
 * When the system lands on prod we should switch to that
 */

import { SOLARPLEX_FEED_API, SOLARPLEX_FEED_URI_PATH } from "lib/constants";
import { hasProp, isObj, isStrArray } from "lib/type-guards";
import { makeAutoObservable, runInAction } from "mobx";

import { CommunityFeedModel } from "./feeds/community-feed";
import { RootStoreModel } from "./root-store";
import { SolarplexCommunity } from "lib/splx-types";

export class CommunitiesModel {
  communities: SolarplexCommunity[] = [];
  communityFeeds: CommunityFeedModel[] = [];

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      { rootStore: false, serialize: false, hydrate: false },
      { autoBind: true },
    );
  }

  serialize() {
    return { communities: this.communities };
  }

  hydrate(v: unknown) {
    if (
      isObj(v) &&
      hasProp(v, "communities") &&
      Array.isArray(v.communities) // check if v.communities is an array
    ) {
      // ensure that every item in the array is a SolarplexCommunity
      const isValidSolarplexCommunityArray = v.communities.every(
        (item: any) =>
          typeof item === "object" &&
          item !== null &&
          "id" in item &&
          "name" in item &&
          "description" in item &&
          "createdAt" in item &&
          "published" in item,
      );

      if (isValidSolarplexCommunityArray) {
        this.communities = v.communities as SolarplexCommunity[];
      }
    }
  }

  async fetch() {
    // fetch communities and put it into this model
    try {
      const solarplexCommunities = await fetch(
        `${SOLARPLEX_FEED_API}/splx/get_all_communities`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "no-cors",
          },
        },
      );
      runInAction(async () => {
        this.communities = (await solarplexCommunities.json())
          .data as SolarplexCommunity[];
        this.communityFeeds = [];
        for (const c of this.communities) {
          this.communityFeeds.push(
            new CommunityFeedModel(this.rootStore, c.id, c),
          );
        }
      });
    } catch (e) {
      this.rootStore.log.error("Failed to fetch communities");
    }
  }
}
