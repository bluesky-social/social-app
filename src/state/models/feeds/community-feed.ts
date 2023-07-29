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
  data: SolarplexCommunity | null = null;
  isRefreshing = false;
  hasLoaded = false;
  error = "";

  constructor(
    public rootStore: RootStoreModel,
    id: string,
    view?: SolarplexCommunity,
  ) {
    this._reactKey = id;
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      { autoBind: true },
    );

    if (view) {
      this.data = view;
      this.hasLoaded = true;
    }
  }

  // async init(id: string) {
  //   console.log(">>>>> init was called");
  //   if (!this.data) {
  //     await this.fetchData(id);
  //   }
  // }

  init = bundleAsync(async (id: string) => {
    console.log(">>>>> init was called");
    if (!this.data) {
      await this.fetchData(id);
    }
  });

  async fetchData(id: string) {
    try {
      const fetchedData = await this.get(id);
      runInAction(() => {
        this.data = fetchedData;
        this.hasLoaded = true;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error;
      });
    }
  }
  // local actions
  // =

  get id() {
    return this.data?.id;
  }

  get hasContent() {
    return this.data?.id !== "";
  }

  get hasError() {
    return this.error !== "";
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent;
  }

  get displayName() {
    if (this.data?.name) {
      return sanitizeDisplayName(this.data?.name);
    }
    return `Community by Solarplex`;
  }
  get isJoined() {
    return this.id
      ? this.rootStore.me.joinedCommunities.communities.includes(this.id)
      : false;
  }

  // public apis
  // =

  async join() {
    console.log("join community");
    if (!this.id) {
      console.error("No community ID defined");
      return;
    }
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
    if (!this.id) {
      console.error("No community ID defined");
      return;
    }
    try {
      await this.rootStore.preferences.leaveCommunity(this.id);
    } catch (error) {
      this.rootStore.log.error("Failed to leave community", error);
    } finally {
      track("CommunityFeed:Leave");
    }
  }

  async toggleJoin() {
    if (this.isJoined) {
      try {
        await this.leave();
      } catch (error) {
        this.rootStore.log.error("Failed to leave community", error);
      }
    } else {
      try {
        await this.join();
      } catch (error) {
        this.rootStore.log.error("Failed to join community", error);
      }
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

  async get(id: string): Promise<SolarplexCommunity> {
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
    let res = {};
    if (communityData.data && communityData.data.length > 0) {
      res = communityData.data[0] as SolarplexCommunity;
    }
    return res as SolarplexCommunity;
  }

  serialize() {
    return JSON.stringify(this.data);
  }
}
