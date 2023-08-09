import {
  ComAtprotoServerDefs,
  ComAtprotoServerListAppPasswords,
} from "@atproto/api";
import {
  DEFAULT_REACTION_EMOJIS,
  SOLARPLEX_FEED_API,
  SQUID_REACTION_EMOJIS,
} from "lib/constants";
import { hasProp, isObj } from "lib/type-guards";
import { makeAutoObservable, runInAction } from "mobx";

import { EmojiItemProp } from "react-native-reactions/lib/components/ReactionView/types";
import { JoinedCommunitiesModel } from "./ui/joined-communities";
import { MyFollowsCache } from "./cache/my-follows";
import { NftModel } from "./content/nft";
import { NotificationsFeedModel } from "./feeds/notifications";
import { PostsFeedModel } from "./feeds/posts";
import { RootStoreModel } from "./root-store";
import { SavedFeedsModel } from "./ui/saved-feeds";

const PROFILE_UPDATE_INTERVAL = 10 * 60 * 1e3; // 10min
const NOTIFS_UPDATE_INTERVAL = 30 * 1e3; // 30sec

export class MeModel {
  did: string = "";
  handle: string = "";
  displayName: string = "";
  description: string = "";
  avatar: string = "";
  splxWallet: string | undefined;
  followsCount: number | undefined;
  followersCount: number | undefined;
  mainFeed: PostsFeedModel;
  savedFeeds: SavedFeedsModel;
  notifications: NotificationsFeedModel;
  joinedCommunities: JoinedCommunitiesModel;
  follows: MyFollowsCache;
  invites: ComAtprotoServerDefs.InviteCode[] = [];
  appPasswords: ComAtprotoServerListAppPasswords.AppPassword[] = [];
  lastProfileStateUpdate = Date.now();
  lastNotifsUpdate = Date.now();
  nft: NftModel;

  get invitesAvailable() {
    return this.invites.filter(isInviteAvailable).length;
  }

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      { rootStore: false, serialize: false, hydrate: false },
      { autoBind: true },
    );
    this.mainFeed = new PostsFeedModel(this.rootStore, "home", {
      algorithm: "reverse-chronological",
    });
    this.notifications = new NotificationsFeedModel(this.rootStore);
    this.follows = new MyFollowsCache(this.rootStore);
    this.savedFeeds = new SavedFeedsModel(this.rootStore);
    this.joinedCommunities = new JoinedCommunitiesModel(this.rootStore);
    this.nft = new NftModel(this.rootStore);
  }

  clear() {
    this.mainFeed.clear();
    this.notifications.clear();
    this.joinedCommunities.clear();
    this.follows.clear();
    this.did = "";
    this.handle = "";
    this.displayName = "";
    this.description = "";
    this.avatar = "";
    this.invites = [];
    this.appPasswords = [];
    this.splxWallet = undefined;
  }

  serialize(): unknown {
    return {
      did: this.did,
      handle: this.handle,
      displayName: this.displayName,
      description: this.description,
      avatar: this.avatar,
    };
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      let did, handle, displayName, description, avatar;
      if (hasProp(v, "did") && typeof v.did === "string") {
        did = v.did;
      }
      if (hasProp(v, "handle") && typeof v.handle === "string") {
        handle = v.handle;
      }
      if (hasProp(v, "displayName") && typeof v.displayName === "string") {
        displayName = v.displayName;
      }
      if (hasProp(v, "description") && typeof v.description === "string") {
        description = v.description;
      }
      if (hasProp(v, "avatar") && typeof v.avatar === "string") {
        avatar = v.avatar;
      }
      if (did && handle) {
        this.did = did;
        this.handle = handle;
        this.displayName = displayName || "";
        this.description = description || "";
        this.avatar = avatar || "";
      }
    }
  }

  async load() {
    const sess = this.rootStore.session;
    this.rootStore.log.debug("MeModel:load", { hasSession: sess.hasSession });
    await this.fetchAllReactions();
    await this.fetchCommunities();
    if (sess.hasSession) {
      this.did = sess.currentSession?.did || "";
      this.handle = sess.currentSession?.handle || "";
      await this.fetchProfile();
      await this.fetchUser();
      await this.nft.fetchNfts(this.splxWallet ?? "");
      this.mainFeed.clear();
      /* dont await */ this.mainFeed.setup().catch((e) => {
        this.rootStore.log.error("Failed to setup main feed model", e);
      });
      /* dont await */ this.notifications.setup().catch((e) => {
        this.rootStore.log.error("Failed to setup notifications model", e);
      });
      this.rootStore.emitSessionLoaded();
      await this.fetchInviteCodes();
      await this.fetchAppPasswords();
    } else {
      this.clear();
    }
  }

  async updateIfNeeded() {
    if (Date.now() - this.lastProfileStateUpdate > PROFILE_UPDATE_INTERVAL) {
      this.rootStore.log.debug("Updating me profile information");
      this.lastProfileStateUpdate = Date.now();
      await this.fetchProfile();
      await this.fetchInviteCodes();
      await this.fetchAppPasswords();
      await this.fetchCommunities();
    }
    if (Date.now() - this.lastNotifsUpdate > NOTIFS_UPDATE_INTERVAL) {
      this.lastNotifsUpdate = Date.now();
      await this.notifications.syncQueue();
    }
  }
  async fetchCommunities() {
    await this.rootStore.communities.fetch();
  }

  async fetchAllReactions() {
    await this.rootStore.reactions.fetch();
  }

  async fetchUser() {
    const user = await fetch(
      `${SOLARPLEX_FEED_API}/splx/get_user/${this.did}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const body = await user.json();
    this.splxWallet = body.user[0]?.wallet;
    // this.splxWallet = "GtarBGsBP63f1unXgW6DFpR2GDprJ7mN9TPURZQg4qwS";
  }

  async fetchProfile() {
    const profile = await this.rootStore.agent.getProfile({
      actor: this.did,
    });
    runInAction(() => {
      if (profile?.data) {
        this.displayName = profile.data.displayName || "";
        this.description = profile.data.description || "";
        this.avatar = profile.data.avatar || "";
        this.followsCount = profile.data.followsCount;
        this.followersCount = profile.data.followersCount;
      } else {
        this.displayName = "";
        this.description = "";
        this.avatar = "";
        this.followsCount = profile.data.followsCount;
        this.followersCount = undefined;
      }
    });
  }

  async fetchInviteCodes() {
    if (this.rootStore.session) {
      try {
        const res =
          await this.rootStore.agent.com.atproto.server.getAccountInviteCodes(
            {},
          );
        runInAction(() => {
          this.invites = res.data.codes;
          this.invites.sort((a, b) => {
            if (!isInviteAvailable(a)) {
              return 1;
            }
            if (!isInviteAvailable(b)) {
              return -1;
            }
            return 0;
          });
        });
      } catch (e) {
        this.rootStore.log.error("Failed to fetch user invite codes", e);
      }
      await this.rootStore.invitedUsers.fetch(this.invites);
    }
  }

  async fetchAppPasswords() {
    if (this.rootStore.session) {
      try {
        const res =
          await this.rootStore.agent.com.atproto.server.listAppPasswords({});
        runInAction(() => {
          this.appPasswords = res.data.passwords;
        });
      } catch (e) {
        this.rootStore.log.error("Failed to fetch user app passwords", e);
      }
    }
  }

  async createAppPassword(name: string) {
    if (this.rootStore.session) {
      try {
        if (this.appPasswords.find((p) => p.name === name)) {
          // TODO: this should be handled by the backend but it's not
          throw new Error("App password with this name already exists");
        }
        const res =
          await this.rootStore.agent.com.atproto.server.createAppPassword({
            name,
          });
        runInAction(() => {
          this.appPasswords.push(res.data);
        });
        return res.data;
      } catch (e) {
        this.rootStore.log.error("Failed to create app password", e);
      }
    }
  }

  async deleteAppPassword(name: string) {
    if (this.rootStore.session) {
      try {
        await this.rootStore.agent.com.atproto.server.revokeAppPassword({
          name: name,
        });
        runInAction(() => {
          this.appPasswords = this.appPasswords.filter((p) => p.name !== name);
        });
      } catch (e) {
        this.rootStore.log.error("Failed to delete app password", e);
      }
    }
  }

  async connectWallet(wallet: string) {
    try {
      fetch(`${SOLARPLEX_FEED_API}/splx/add_wallet_to_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          did: this.did,
          wallet: wallet,
        }),
      });
      this.splxWallet = wallet;
    } catch (e: any) {
      this.splxWallet = undefined;
      this.rootStore.log.error("Failed to connect wallet", e);
    }
  }
}

function isInviteAvailable(invite: ComAtprotoServerDefs.InviteCode): boolean {
  return invite.available - invite.uses.length > 0 && !invite.disabled;
}
