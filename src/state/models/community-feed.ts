import { makeAutoObservable, runInAction } from "mobx";

import { AppBskyFeedDefs } from "@atproto/api";
import { RootStoreModel } from "state/models/root-store";
import { SolarplexCommunity } from "lib/splx-types";
import { sanitizeDisplayName } from "lib/strings/display-names";
import { track } from "lib/analytics/analytics";
import { updateDataOptimistically } from "lib/async/revertible";

export class CommunityFeedModel {
  // data
  _reactKey: string;
  data: SolarplexCommunity;
  isJoined: false;

  constructor(
    public rootStore: RootStoreModel,
    view: SolarplexCommunity,
  ) {
    this._reactKey = view.id;
    this.data = view;
    this.isJoined = false;
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
  //TODO(viksit)[F1]: add save communities to root model
  get isSaved() {
    return true;
    // return this.rootStore.preferences.savedFeeds.includes(this.uri);
  }

  // public apis
  // =

  async join() {
    console.log("join community");
    // try {
    //   await this.rootStore.preferences.addSavedFeed(this.uri);
    // } catch (error) {
    //   this.rootStore.log.error("Failed to save feed", error);
    // } finally {
    //   track("CustomFeed:Save");
    // }
  }

  async leave() {
    console.log("leave community");
    // try {
    //   await this.rootStore.preferences.removeSavedFeed(this.uri);
    // } catch (error) {
    //   this.rootStore.log.error("Failed to unsave feed", error);
    // } finally {
    //   track("CustomFeed:Unsave");
    // }
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
