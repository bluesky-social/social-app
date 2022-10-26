import { Client as XrpcClient, ServiceClient as XrpcServiceClient } from '@atproto/xrpc';
import * as ComAtprotoCreateAccount from './types/com/atproto/createAccount';
import * as ComAtprotoCreateInviteCode from './types/com/atproto/createInviteCode';
import * as ComAtprotoCreateSession from './types/com/atproto/createSession';
import * as ComAtprotoDeleteAccount from './types/com/atproto/deleteAccount';
import * as ComAtprotoDeleteSession from './types/com/atproto/deleteSession';
import * as ComAtprotoGetAccount from './types/com/atproto/getAccount';
import * as ComAtprotoGetAccountsConfig from './types/com/atproto/getAccountsConfig';
import * as ComAtprotoGetSession from './types/com/atproto/getSession';
import * as ComAtprotoRepoBatchWrite from './types/com/atproto/repoBatchWrite';
import * as ComAtprotoRepoCreateRecord from './types/com/atproto/repoCreateRecord';
import * as ComAtprotoRepoDeleteRecord from './types/com/atproto/repoDeleteRecord';
import * as ComAtprotoRepoDescribe from './types/com/atproto/repoDescribe';
import * as ComAtprotoRepoGetRecord from './types/com/atproto/repoGetRecord';
import * as ComAtprotoRepoListRecords from './types/com/atproto/repoListRecords';
import * as ComAtprotoRepoPutRecord from './types/com/atproto/repoPutRecord';
import * as ComAtprotoRequestAccountPasswordReset from './types/com/atproto/requestAccountPasswordReset';
import * as ComAtprotoResetAccountPassword from './types/com/atproto/resetAccountPassword';
import * as ComAtprotoResolveName from './types/com/atproto/resolveName';
import * as ComAtprotoSyncGetRepo from './types/com/atproto/syncGetRepo';
import * as ComAtprotoSyncGetRoot from './types/com/atproto/syncGetRoot';
import * as ComAtprotoSyncUpdateRepo from './types/com/atproto/syncUpdateRepo';
import * as AppBskyBadge from './types/app/bsky/badge';
import * as AppBskyBadgeAccept from './types/app/bsky/badgeAccept';
import * as AppBskyBadgeOffer from './types/app/bsky/badgeOffer';
import * as AppBskyFollow from './types/app/bsky/follow';
import * as AppBskyGetAuthorFeed from './types/app/bsky/getAuthorFeed';
import * as AppBskyGetBadgeMembers from './types/app/bsky/getBadgeMembers';
import * as AppBskyGetHomeFeed from './types/app/bsky/getHomeFeed';
import * as AppBskyGetLikedBy from './types/app/bsky/getLikedBy';
import * as AppBskyGetNotificationCount from './types/app/bsky/getNotificationCount';
import * as AppBskyGetNotifications from './types/app/bsky/getNotifications';
import * as AppBskyGetPostThread from './types/app/bsky/getPostThread';
import * as AppBskyGetProfile from './types/app/bsky/getProfile';
import * as AppBskyGetRepostedBy from './types/app/bsky/getRepostedBy';
import * as AppBskyGetUserFollowers from './types/app/bsky/getUserFollowers';
import * as AppBskyGetUserFollows from './types/app/bsky/getUserFollows';
import * as AppBskyGetUsersSearch from './types/app/bsky/getUsersSearch';
import * as AppBskyGetUsersTypeahead from './types/app/bsky/getUsersTypeahead';
import * as AppBskyLike from './types/app/bsky/like';
import * as AppBskyMediaEmbed from './types/app/bsky/mediaEmbed';
import * as AppBskyPost from './types/app/bsky/post';
import * as AppBskyPostNotificationsSeen from './types/app/bsky/postNotificationsSeen';
import * as AppBskyProfile from './types/app/bsky/profile';
import * as AppBskyRepost from './types/app/bsky/repost';
import * as AppBskyUpdateProfile from './types/app/bsky/updateProfile';
export * as ComAtprotoCreateAccount from './types/com/atproto/createAccount';
export * as ComAtprotoCreateInviteCode from './types/com/atproto/createInviteCode';
export * as ComAtprotoCreateSession from './types/com/atproto/createSession';
export * as ComAtprotoDeleteAccount from './types/com/atproto/deleteAccount';
export * as ComAtprotoDeleteSession from './types/com/atproto/deleteSession';
export * as ComAtprotoGetAccount from './types/com/atproto/getAccount';
export * as ComAtprotoGetAccountsConfig from './types/com/atproto/getAccountsConfig';
export * as ComAtprotoGetSession from './types/com/atproto/getSession';
export * as ComAtprotoRepoBatchWrite from './types/com/atproto/repoBatchWrite';
export * as ComAtprotoRepoCreateRecord from './types/com/atproto/repoCreateRecord';
export * as ComAtprotoRepoDeleteRecord from './types/com/atproto/repoDeleteRecord';
export * as ComAtprotoRepoDescribe from './types/com/atproto/repoDescribe';
export * as ComAtprotoRepoGetRecord from './types/com/atproto/repoGetRecord';
export * as ComAtprotoRepoListRecords from './types/com/atproto/repoListRecords';
export * as ComAtprotoRepoPutRecord from './types/com/atproto/repoPutRecord';
export * as ComAtprotoRequestAccountPasswordReset from './types/com/atproto/requestAccountPasswordReset';
export * as ComAtprotoResetAccountPassword from './types/com/atproto/resetAccountPassword';
export * as ComAtprotoResolveName from './types/com/atproto/resolveName';
export * as ComAtprotoSyncGetRepo from './types/com/atproto/syncGetRepo';
export * as ComAtprotoSyncGetRoot from './types/com/atproto/syncGetRoot';
export * as ComAtprotoSyncUpdateRepo from './types/com/atproto/syncUpdateRepo';
export * as AppBskyBadge from './types/app/bsky/badge';
export * as AppBskyBadgeAccept from './types/app/bsky/badgeAccept';
export * as AppBskyBadgeOffer from './types/app/bsky/badgeOffer';
export * as AppBskyFollow from './types/app/bsky/follow';
export * as AppBskyGetAuthorFeed from './types/app/bsky/getAuthorFeed';
export * as AppBskyGetBadgeMembers from './types/app/bsky/getBadgeMembers';
export * as AppBskyGetHomeFeed from './types/app/bsky/getHomeFeed';
export * as AppBskyGetLikedBy from './types/app/bsky/getLikedBy';
export * as AppBskyGetNotificationCount from './types/app/bsky/getNotificationCount';
export * as AppBskyGetNotifications from './types/app/bsky/getNotifications';
export * as AppBskyGetPostThread from './types/app/bsky/getPostThread';
export * as AppBskyGetProfile from './types/app/bsky/getProfile';
export * as AppBskyGetRepostedBy from './types/app/bsky/getRepostedBy';
export * as AppBskyGetUserFollowers from './types/app/bsky/getUserFollowers';
export * as AppBskyGetUserFollows from './types/app/bsky/getUserFollows';
export * as AppBskyGetUsersSearch from './types/app/bsky/getUsersSearch';
export * as AppBskyGetUsersTypeahead from './types/app/bsky/getUsersTypeahead';
export * as AppBskyLike from './types/app/bsky/like';
export * as AppBskyMediaEmbed from './types/app/bsky/mediaEmbed';
export * as AppBskyPost from './types/app/bsky/post';
export * as AppBskyPostNotificationsSeen from './types/app/bsky/postNotificationsSeen';
export * as AppBskyProfile from './types/app/bsky/profile';
export * as AppBskyRepost from './types/app/bsky/repost';
export * as AppBskyUpdateProfile from './types/app/bsky/updateProfile';
export declare class Client {
    xrpc: XrpcClient;
    constructor();
    service(serviceUri: string | URL): ServiceClient;
}
declare const defaultInst: Client;
export default defaultInst;
export declare class ServiceClient {
    _baseClient: Client;
    xrpc: XrpcServiceClient;
    com: ComNS;
    app: AppNS;
    constructor(baseClient: Client, xrpcService: XrpcServiceClient);
    setHeader(key: string, value: string): void;
}
export declare class ComNS {
    _service: ServiceClient;
    atproto: AtprotoNS;
    constructor(service: ServiceClient);
}
export declare class AtprotoNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    createAccount(params: ComAtprotoCreateAccount.QueryParams, data?: ComAtprotoCreateAccount.InputSchema, opts?: ComAtprotoCreateAccount.CallOptions): Promise<ComAtprotoCreateAccount.Response>;
    createInviteCode(params: ComAtprotoCreateInviteCode.QueryParams, data?: ComAtprotoCreateInviteCode.InputSchema, opts?: ComAtprotoCreateInviteCode.CallOptions): Promise<ComAtprotoCreateInviteCode.Response>;
    createSession(params: ComAtprotoCreateSession.QueryParams, data?: ComAtprotoCreateSession.InputSchema, opts?: ComAtprotoCreateSession.CallOptions): Promise<ComAtprotoCreateSession.Response>;
    deleteAccount(params: ComAtprotoDeleteAccount.QueryParams, data?: ComAtprotoDeleteAccount.InputSchema, opts?: ComAtprotoDeleteAccount.CallOptions): Promise<ComAtprotoDeleteAccount.Response>;
    deleteSession(params: ComAtprotoDeleteSession.QueryParams, data?: ComAtprotoDeleteSession.InputSchema, opts?: ComAtprotoDeleteSession.CallOptions): Promise<ComAtprotoDeleteSession.Response>;
    getAccount(params: ComAtprotoGetAccount.QueryParams, data?: ComAtprotoGetAccount.InputSchema, opts?: ComAtprotoGetAccount.CallOptions): Promise<ComAtprotoGetAccount.Response>;
    getAccountsConfig(params: ComAtprotoGetAccountsConfig.QueryParams, data?: ComAtprotoGetAccountsConfig.InputSchema, opts?: ComAtprotoGetAccountsConfig.CallOptions): Promise<ComAtprotoGetAccountsConfig.Response>;
    getSession(params: ComAtprotoGetSession.QueryParams, data?: ComAtprotoGetSession.InputSchema, opts?: ComAtprotoGetSession.CallOptions): Promise<ComAtprotoGetSession.Response>;
    repoBatchWrite(params: ComAtprotoRepoBatchWrite.QueryParams, data?: ComAtprotoRepoBatchWrite.InputSchema, opts?: ComAtprotoRepoBatchWrite.CallOptions): Promise<ComAtprotoRepoBatchWrite.Response>;
    repoCreateRecord(params: ComAtprotoRepoCreateRecord.QueryParams, data?: ComAtprotoRepoCreateRecord.InputSchema, opts?: ComAtprotoRepoCreateRecord.CallOptions): Promise<ComAtprotoRepoCreateRecord.Response>;
    repoDeleteRecord(params: ComAtprotoRepoDeleteRecord.QueryParams, data?: ComAtprotoRepoDeleteRecord.InputSchema, opts?: ComAtprotoRepoDeleteRecord.CallOptions): Promise<ComAtprotoRepoDeleteRecord.Response>;
    repoDescribe(params: ComAtprotoRepoDescribe.QueryParams, data?: ComAtprotoRepoDescribe.InputSchema, opts?: ComAtprotoRepoDescribe.CallOptions): Promise<ComAtprotoRepoDescribe.Response>;
    repoGetRecord(params: ComAtprotoRepoGetRecord.QueryParams, data?: ComAtprotoRepoGetRecord.InputSchema, opts?: ComAtprotoRepoGetRecord.CallOptions): Promise<ComAtprotoRepoGetRecord.Response>;
    repoListRecords(params: ComAtprotoRepoListRecords.QueryParams, data?: ComAtprotoRepoListRecords.InputSchema, opts?: ComAtprotoRepoListRecords.CallOptions): Promise<ComAtprotoRepoListRecords.Response>;
    repoPutRecord(params: ComAtprotoRepoPutRecord.QueryParams, data?: ComAtprotoRepoPutRecord.InputSchema, opts?: ComAtprotoRepoPutRecord.CallOptions): Promise<ComAtprotoRepoPutRecord.Response>;
    requestAccountPasswordReset(params: ComAtprotoRequestAccountPasswordReset.QueryParams, data?: ComAtprotoRequestAccountPasswordReset.InputSchema, opts?: ComAtprotoRequestAccountPasswordReset.CallOptions): Promise<ComAtprotoRequestAccountPasswordReset.Response>;
    resetAccountPassword(params: ComAtprotoResetAccountPassword.QueryParams, data?: ComAtprotoResetAccountPassword.InputSchema, opts?: ComAtprotoResetAccountPassword.CallOptions): Promise<ComAtprotoResetAccountPassword.Response>;
    resolveName(params: ComAtprotoResolveName.QueryParams, data?: ComAtprotoResolveName.InputSchema, opts?: ComAtprotoResolveName.CallOptions): Promise<ComAtprotoResolveName.Response>;
    syncGetRepo(params: ComAtprotoSyncGetRepo.QueryParams, data?: ComAtprotoSyncGetRepo.InputSchema, opts?: ComAtprotoSyncGetRepo.CallOptions): Promise<ComAtprotoSyncGetRepo.Response>;
    syncGetRoot(params: ComAtprotoSyncGetRoot.QueryParams, data?: ComAtprotoSyncGetRoot.InputSchema, opts?: ComAtprotoSyncGetRoot.CallOptions): Promise<ComAtprotoSyncGetRoot.Response>;
    syncUpdateRepo(params: ComAtprotoSyncUpdateRepo.QueryParams, data?: ComAtprotoSyncUpdateRepo.InputSchema, opts?: ComAtprotoSyncUpdateRepo.CallOptions): Promise<ComAtprotoSyncUpdateRepo.Response>;
}
export declare class AppNS {
    _service: ServiceClient;
    bsky: BskyNS;
    constructor(service: ServiceClient);
}
export declare class BskyNS {
    _service: ServiceClient;
    badge: BadgeRecord;
    badgeAccept: BadgeAcceptRecord;
    badgeOffer: BadgeOfferRecord;
    follow: FollowRecord;
    like: LikeRecord;
    mediaEmbed: MediaEmbedRecord;
    post: PostRecord;
    profile: ProfileRecord;
    repost: RepostRecord;
    constructor(service: ServiceClient);
    getAuthorFeed(params: AppBskyGetAuthorFeed.QueryParams, data?: AppBskyGetAuthorFeed.InputSchema, opts?: AppBskyGetAuthorFeed.CallOptions): Promise<AppBskyGetAuthorFeed.Response>;
    getBadgeMembers(params: AppBskyGetBadgeMembers.QueryParams, data?: AppBskyGetBadgeMembers.InputSchema, opts?: AppBskyGetBadgeMembers.CallOptions): Promise<AppBskyGetBadgeMembers.Response>;
    getHomeFeed(params: AppBskyGetHomeFeed.QueryParams, data?: AppBskyGetHomeFeed.InputSchema, opts?: AppBskyGetHomeFeed.CallOptions): Promise<AppBskyGetHomeFeed.Response>;
    getLikedBy(params: AppBskyGetLikedBy.QueryParams, data?: AppBskyGetLikedBy.InputSchema, opts?: AppBskyGetLikedBy.CallOptions): Promise<AppBskyGetLikedBy.Response>;
    getNotificationCount(params: AppBskyGetNotificationCount.QueryParams, data?: AppBskyGetNotificationCount.InputSchema, opts?: AppBskyGetNotificationCount.CallOptions): Promise<AppBskyGetNotificationCount.Response>;
    getNotifications(params: AppBskyGetNotifications.QueryParams, data?: AppBskyGetNotifications.InputSchema, opts?: AppBskyGetNotifications.CallOptions): Promise<AppBskyGetNotifications.Response>;
    getPostThread(params: AppBskyGetPostThread.QueryParams, data?: AppBskyGetPostThread.InputSchema, opts?: AppBskyGetPostThread.CallOptions): Promise<AppBskyGetPostThread.Response>;
    getProfile(params: AppBskyGetProfile.QueryParams, data?: AppBskyGetProfile.InputSchema, opts?: AppBskyGetProfile.CallOptions): Promise<AppBskyGetProfile.Response>;
    getRepostedBy(params: AppBskyGetRepostedBy.QueryParams, data?: AppBskyGetRepostedBy.InputSchema, opts?: AppBskyGetRepostedBy.CallOptions): Promise<AppBskyGetRepostedBy.Response>;
    getUserFollowers(params: AppBskyGetUserFollowers.QueryParams, data?: AppBskyGetUserFollowers.InputSchema, opts?: AppBskyGetUserFollowers.CallOptions): Promise<AppBskyGetUserFollowers.Response>;
    getUserFollows(params: AppBskyGetUserFollows.QueryParams, data?: AppBskyGetUserFollows.InputSchema, opts?: AppBskyGetUserFollows.CallOptions): Promise<AppBskyGetUserFollows.Response>;
    getUsersSearch(params: AppBskyGetUsersSearch.QueryParams, data?: AppBskyGetUsersSearch.InputSchema, opts?: AppBskyGetUsersSearch.CallOptions): Promise<AppBskyGetUsersSearch.Response>;
    getUsersTypeahead(params: AppBskyGetUsersTypeahead.QueryParams, data?: AppBskyGetUsersTypeahead.InputSchema, opts?: AppBskyGetUsersTypeahead.CallOptions): Promise<AppBskyGetUsersTypeahead.Response>;
    postNotificationsSeen(params: AppBskyPostNotificationsSeen.QueryParams, data?: AppBskyPostNotificationsSeen.InputSchema, opts?: AppBskyPostNotificationsSeen.CallOptions): Promise<AppBskyPostNotificationsSeen.Response>;
    updateProfile(params: AppBskyUpdateProfile.QueryParams, data?: AppBskyUpdateProfile.InputSchema, opts?: AppBskyUpdateProfile.CallOptions): Promise<AppBskyUpdateProfile.Response>;
}
export declare class BadgeRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyBadge.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyBadge.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyBadge.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class BadgeAcceptRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyBadgeAccept.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyBadgeAccept.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyBadgeAccept.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class BadgeOfferRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyBadgeOffer.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyBadgeOffer.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyBadgeOffer.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class FollowRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyFollow.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFollow.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyFollow.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class LikeRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyLike.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyLike.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyLike.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class MediaEmbedRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyMediaEmbed.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyMediaEmbed.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyMediaEmbed.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class PostRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyPost.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyPost.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyPost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class ProfileRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyProfile.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyProfile.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyProfile.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class RepostRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyRepost.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyRepost.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.QueryParams, 'collection'>, record: AppBskyRepost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
