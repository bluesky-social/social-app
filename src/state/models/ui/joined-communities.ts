import { SOLARPLEX_FEED_API, SOLARPLEX_FEED_URI_PATH } from "lib/constants";
import { makeAutoObservable, runInAction } from "mobx";

import { CommunityFeedModel } from "../community-feed";
import { CustomFeedModel } from "../feeds/custom-feed";
import { RootStoreModel } from "../root-store";
import { bundleAsync } from "lib/async/bundle";
import { cleanError } from "lib/strings/errors";
import { track } from "lib/analytics/analytics";

export class JoinedCommunitiesModel {
  // simply stores ids of communities joined by current user
  communities: string[] = [];

  // data
  _communityModelCache: Record<string, CommunityFeedModel> = {};

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      { autoBind: true },
    );
  }
  /**
   * syncs the cached models against the current state
   * should only be called by the preferences model after syncing state
   */
  updateCache = bundleAsync(async (clearCache?: boolean) => {
    let newCommunityModels: Record<string, CommunityFeedModel> = {};
    if (!clearCache) {
      newCommunityModels = { ...this._communityModelCache };
    }

    // fetch the joined communities
    const response = await fetch(
      `${SOLARPLEX_FEED_API}/splx/get_communites_for_user/${this.rootStore.me.did}`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "no-cors",
        },
      },
    );
    const joinedCommunities = await response.json();
    this.communities = joinedCommunities;

    // collect the community IDs that haven't been synced yet
    const neededCommunityIds = this.communities.filter(
      (id) => !(id in newCommunityModels),
    );

    // fetch the missing models
    for (const id of neededCommunityIds) {
      const community = await this.fetchCommunity(id);
      newCommunityModels[id] = community;
    }

    // merge into the cache
    runInAction(() => {
      this._communityModelCache = newCommunityModels;
    });
  });

  async fetchCommunity(id: string): Promise<CommunityFeedModel> {
    const response = await fetch(
      `${SOLARPLEX_FEED_API}/splx/get_community_by_id/${id}`,
      {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "no-cors",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch community with ID ${id}`);
    }

    const communityData = await response.json();
    return new CommunityFeedModel(this.rootStore, communityData);
  }
  // public api
  // =

  // TODO(viksit)[F1]: joined communities may not be happening
  // lets make sure these are getting synced with the preferenecs
  async join(community: CommunityFeedModel) {
    try {
      await community.join();
    } catch (e: any) {
      this.rootStore.log.error("Failed to join community", e);
    }
  }
  async leave(community: CommunityFeedModel) {
    try {
      await community.leave();
    } catch (e: any) {
      this.rootStore.log.error("Failed to leave community", e);
    }
  }

  /**
   * Nuke all data
   */
  clear() {
    this.communities = [];
    this._communityModelCache = {};
  }

  // state transitions
  // =
}
