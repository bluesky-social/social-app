import { makeAutoObservable, runInAction } from "mobx";

import { AppBskyFeedDefs } from "@atproto/api";
import { RootStoreModel } from "state/models/root-store";
import { SolarplexCommunity } from "lib/splx-types";
import { bundleAsync } from "lib/async/bundle";
import { sanitizeDisplayName } from "lib/strings/display-names";
import { track } from "lib/analytics/analytics";
import { updateDataOptimistically } from "lib/async/revertible";

export class CommunityFeedModel {
  // data
  _reactKey: string;
  data: SolarplexCommunity;

  constructor(
    public rootStore: RootStoreModel,
    view: SolarplexCommunity,
  ) {
    this._reactKey = view.id;
    this.data = view;
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

  get displayName() {
    if (this.data.name) {
      return sanitizeDisplayName(this.data.name);
    }
    return `Community by Solarplex`;
  }
  get isJoined() {
    return this.rootStore.preferences.joinedCommunities.includes(this.id);
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

  serialize() {
    return JSON.stringify(this.data);
  }
}
