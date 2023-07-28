import { makeAutoObservable, runInAction } from "mobx";

import { AppBskyFeedDefs } from "@atproto/api";
import { RootStoreModel } from "state/models/root-store";
import { SOLARPLEX_FEED_API } from "lib/constants";
import { SolarplexCommunity } from "lib/splx-types";
import { bundleAsync } from "lib/async/bundle";
import { sanitizeDisplayName } from "lib/strings/display-names";
import { track } from "lib/analytics/analytics";
import { updateDataOptimistically } from "lib/async/revertible";

export class CommunityFeedModel {
  // data
  _reactKey: string;
  data: SolarplexCommunity;
  isRefreshing = false;
  hasLoaded = false;
  error = "";

  constructor(
    public rootStore: RootStoreModel,
    id: string,
    view?: SolarplexCommunity,
  ) {
    this._reactKey = id;
    if (view) {
      this.data = view;
    } else {
      // fetch via id
    }
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      { autoBind: true },
    );
  }

  // local actions
  // =

  get id() {
    return this.data.id;
  }

  get hasContent() {
    return this.data.id !== "";
  }

  get hasError() {
    return this.error !== "";
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent;
  }

  get displayName() {
    if (this.data.name) {
      return sanitizeDisplayName(this.data.name);
    }
    return `Community by Solarplex`;
  }
  get isJoined() {
    return this.rootStore.me.joinedCommunities.communities.includes(this.id);
  }

  // public apis
  // =

  async join() {
    console.log("join community");
    try {
      await this.rootStore.preferences.joinCommunity(this.id);
    } catch (error) {
      this.rootStore.log.error("Failed to join community", error);
    } finally {
      track("CommunityFeed:Join");
    }
  }

  async leave() {
    console.log("leave community");
    try {
      await this.rootStore.preferences.leaveCommunity(this.id);
    } catch (error) {
      this.rootStore.log.error("Failed to leave community", error);
    } finally {
      track("CommunityFeed:Leave");
    }
  }

  async reload() {
    // const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerator({
    //   feed: this.data.uri,
    // });
    // runInAction(() => {
    //   this.data = res.data.view;
    //   this.isOnline = res.data.isOnline;
    //   this.isValid = res.data.isValid;
    // });
  }

  async get(id: string): Promise<CommunityFeedModel> {
    const response = await fetch(
      `${SOLARPLEX_FEED_API}/splx/get_community/${id}`,
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

  serialize() {
    return JSON.stringify(this.data);
  }
}
