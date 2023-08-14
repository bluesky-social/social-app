import { makeAutoObservable, runInAction } from "mobx";

import { MeModel } from "./models/me";
import { RootStoreModel } from "./models/root-store";
import { SOLARPLEX_V1_API } from "lib/constants";

interface Reward {
  image: string;
  name: string;
  description: string;
  attributes: {
    emote: string;
  };
}

interface MissionProgress {
  count: number;
  percent: number;
  endValue: number;
}

interface Mission {
  id: string;
  progress: MissionProgress;
  shouldClaim: boolean;
  isClaiming: boolean;
  reward?: Reward;
  missionClaimId?: string;
  rewardClaimId?: string;
}

interface User {
  id: string;
  score: number;
}

interface MissionResponse {
  user: User;
  daily: Mission;
  weekly: Mission;
}

interface Missions {
  [did: string]: MissionResponse;
}

export const apiUrls = {
  rewards: {
    getMissions: (userId: string) => `/rewards/missions/${userId}`,
    postClaimReward: (userId: string) => `/rewards/claim/${userId}`,
  },
};

export class RewardsModel {
  users: Missions = {};
  inFlight: { [type: string]: { [id: string]: number } } = {};
  scheduled: {
    [type: string]: { [id: string]: ReturnType<typeof setTimeout> };
  } = {};

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      { autoBind: true },
    );
  }

  dailyMissionId(userId: string) {
    return this.users[userId]?.daily?.id ?? '';
  }

  weeklyMissionId(userId: string) {
    return this.users[userId]?.weekly?.id ?? '';
  }

  async _claimReward(userId: string, missionId: string) {
    const wallet = this.rootStore.me.splxWallet;
    try {
      if (!missionId || !wallet) {
        throw new Error("noMissionIdOrWallet");
      }
      runInAction(async () => {
        const missionIds: string[] = [];
        if (missionId) {
          missionIds.push(missionId);
        }
        if (!missionIds.length) {
          return;
        }
        if (!this.inFlight["claims"]) {
          this.inFlight["claims"] = {};
        }
        this.inFlight["claims"][missionId] = 1;
        const response = await fetch(
          `${SOLARPLEX_V1_API}${apiUrls.rewards.postClaimReward(userId)}`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Access-Control-Allow-Origin": "no-cors",
            },
            body: JSON.stringify({
              mission: {
                missionId: missionIds,
                wallet,
              },
            }),
          },
        );
        delete this.inFlight["claims"][missionId];
        if (!response.ok) {
          throw new Error(
            `Claim request for ${userId} for mission ${missionId} failed with status: ${response.statusText}`,
          );
        }
        const json = (await response.json()) as MissionResponse;
        this.users[userId] = json;
      });
    } catch (err) {
      console.error(`Error claiming mission ${missionId} for ${userId}`, err);
      throw err;
    }
  }
  
  async claimDailyReward(userId: string) {
    if (!this.shouldClaimDaily(userId)) {
      return;
    }
    return await this._claimReward(userId, this.dailyMissionId(userId));
  }

  async claimWeeklyReward(userId: string) {
    if (!this.shouldClaimWeekly(userId)) {
      return;
    }
    return await this._claimReward(userId, this.weeklyMissionId(userId));
  }

  shouldClaim(userId: string): boolean | undefined {
    return this.shouldClaimDaily(userId) || this.shouldClaimWeekly(userId);
  }

  shouldClaimDaily(userId: string): boolean | undefined {
    return this.users[userId]?.daily.shouldClaim && !this.isClaimingDaily(userId);
  }

  shouldClaimWeekly(userId: string): boolean | undefined {
    // TODO(Partyman): Change this from isClaimingDaily to weekly when we figure out what that looks like.
    return this.users[userId]?.weekly.shouldClaim && this.isClaimingWeekly(userId);
  }

  dailyInFlight(userId: string) {
    return !!this.inFlight["claims"]?.[this.users[userId]?.daily?.id];
  }

  weeklyInFlight(userId: string) {
    return !!this.inFlight["claims"]?.[this.users[userId]?.weekly?.id];
  }

  isClaiming(userId: string) {
    return this.isClaimingDaily(userId) || this.isClaimingWeekly(userId);
  }

  isClaimingDaily(userId: string) {
    return (
      !!this.dailyInFlight(userId) ||
      !!this.users[userId]?.daily?.isClaiming
    );
  }

  isClaimingWeekly(userId: string) {
    return (
      !!this.weeklyInFlight(userId) || 
      !!this.users[userId]?.weekly?.isClaiming
    );
  }

  hasClaimedDaily(userId: string) {
    return !!(this.users[userId]?.daily?.missionClaimId || this.users[userId]?.daily?.rewardClaimId);
  }

  hasClaimedWeekly(userId: string) {
    return !!(this.users[userId]?.weekly?.missionClaimId || this.users[userId]?.weekly?.rewardClaimId);
  }

  dailyReward(userId: string) {
    return this.users[userId]?.daily?.reward;
  }

  weeklyReward(userId: string) {
    return this.users[userId]?.weekly?.reward;
  }

  dailyProgress(userId: string) {
    return (
      this.users[userId]?.daily?.progress ?? {
        count: 0,
        percent: 0,
        endValue: 1,
      }
    );
  }

  weeklyProgress(userId: string) {
    return (
      this.users[userId]?.weekly?.progress ?? {
        count: 0,
        percent: 0,
        endValue: 7,
      }
    );
  }

  async fetchMissions(userId: string) {
    try {
      if (userId === "") {
        throw new Error(`No did passed to fetch did-${userId}`);
      }
      if (this.inFlight["missions"]?.[userId]) {
        return;
      }
      runInAction(async () => {
        if (this.scheduled["missions"]?.[userId]) {
          clearTimeout(this.scheduled["missions"][userId]);
          delete this.scheduled["missions"][userId];
        }
        if (!this.inFlight["missions"]) {
          this.inFlight["missions"] = {};
        }
        this.inFlight["missions"][userId] = 1;
        const response = await fetch(
          `${SOLARPLEX_V1_API}${apiUrls.rewards.getMissions(userId)}`,
        );
        if (!response.ok) {
          throw new Error(
            `API request failed with status: ${response.statusText}`,
          );
        }
        const json = (await response.json()) as MissionResponse;
        this.users[userId] = json;
      });
    } catch (err) {
      console.error(`Error fetching missions for ${userId}`, err);
      throw err;
    } finally {
      const to = setTimeout(() => this.fetchMissions(userId), 1000);
      runInAction(() => {
        if (!this.scheduled["missions"]) {
          this.scheduled["missions"] = {};
        }
        this.scheduled["missions"][userId] = to;
        delete this.inFlight["missions"][userId];
      });
    }
  }
}
