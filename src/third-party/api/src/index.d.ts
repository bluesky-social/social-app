import { Client as XrpcClient, ServiceClient as XrpcServiceClient } from '@adxp/xrpc';
import * as TodoAdxCreateAccount from './types/todo/adx/createAccount';
import * as TodoAdxCreateSession from './types/todo/adx/createSession';
import * as TodoAdxDeleteAccount from './types/todo/adx/deleteAccount';
import * as TodoAdxDeleteSession from './types/todo/adx/deleteSession';
import * as TodoAdxGetAccount from './types/todo/adx/getAccount';
import * as TodoAdxGetAccountsConfig from './types/todo/adx/getAccountsConfig';
import * as TodoAdxGetSession from './types/todo/adx/getSession';
import * as TodoAdxRepoBatchWrite from './types/todo/adx/repoBatchWrite';
import * as TodoAdxRepoCreateRecord from './types/todo/adx/repoCreateRecord';
import * as TodoAdxRepoDeleteRecord from './types/todo/adx/repoDeleteRecord';
import * as TodoAdxRepoDescribe from './types/todo/adx/repoDescribe';
import * as TodoAdxRepoGetRecord from './types/todo/adx/repoGetRecord';
import * as TodoAdxRepoListRecords from './types/todo/adx/repoListRecords';
import * as TodoAdxRepoPutRecord from './types/todo/adx/repoPutRecord';
import * as TodoAdxResolveName from './types/todo/adx/resolveName';
import * as TodoAdxSyncGetRepo from './types/todo/adx/syncGetRepo';
import * as TodoAdxSyncGetRoot from './types/todo/adx/syncGetRoot';
import * as TodoAdxSyncUpdateRepo from './types/todo/adx/syncUpdateRepo';
import * as TodoSocialBadge from './types/todo/social/badge';
import * as TodoSocialFollow from './types/todo/social/follow';
import * as TodoSocialGetAuthorFeed from './types/todo/social/getAuthorFeed';
import * as TodoSocialGetHomeFeed from './types/todo/social/getHomeFeed';
import * as TodoSocialGetLikedBy from './types/todo/social/getLikedBy';
import * as TodoSocialGetNotificationCount from './types/todo/social/getNotificationCount';
import * as TodoSocialGetNotifications from './types/todo/social/getNotifications';
import * as TodoSocialGetPostThread from './types/todo/social/getPostThread';
import * as TodoSocialGetProfile from './types/todo/social/getProfile';
import * as TodoSocialGetRepostedBy from './types/todo/social/getRepostedBy';
import * as TodoSocialGetUserFollowers from './types/todo/social/getUserFollowers';
import * as TodoSocialGetUserFollows from './types/todo/social/getUserFollows';
import * as TodoSocialLike from './types/todo/social/like';
import * as TodoSocialMediaEmbed from './types/todo/social/mediaEmbed';
import * as TodoSocialPost from './types/todo/social/post';
import * as TodoSocialPostNotificationsSeen from './types/todo/social/postNotificationsSeen';
import * as TodoSocialProfile from './types/todo/social/profile';
import * as TodoSocialRepost from './types/todo/social/repost';
export * as TodoAdxCreateAccount from './types/todo/adx/createAccount';
export * as TodoAdxCreateSession from './types/todo/adx/createSession';
export * as TodoAdxDeleteAccount from './types/todo/adx/deleteAccount';
export * as TodoAdxDeleteSession from './types/todo/adx/deleteSession';
export * as TodoAdxGetAccount from './types/todo/adx/getAccount';
export * as TodoAdxGetAccountsConfig from './types/todo/adx/getAccountsConfig';
export * as TodoAdxGetSession from './types/todo/adx/getSession';
export * as TodoAdxRepoBatchWrite from './types/todo/adx/repoBatchWrite';
export * as TodoAdxRepoCreateRecord from './types/todo/adx/repoCreateRecord';
export * as TodoAdxRepoDeleteRecord from './types/todo/adx/repoDeleteRecord';
export * as TodoAdxRepoDescribe from './types/todo/adx/repoDescribe';
export * as TodoAdxRepoGetRecord from './types/todo/adx/repoGetRecord';
export * as TodoAdxRepoListRecords from './types/todo/adx/repoListRecords';
export * as TodoAdxRepoPutRecord from './types/todo/adx/repoPutRecord';
export * as TodoAdxResolveName from './types/todo/adx/resolveName';
export * as TodoAdxSyncGetRepo from './types/todo/adx/syncGetRepo';
export * as TodoAdxSyncGetRoot from './types/todo/adx/syncGetRoot';
export * as TodoAdxSyncUpdateRepo from './types/todo/adx/syncUpdateRepo';
export * as TodoSocialBadge from './types/todo/social/badge';
export * as TodoSocialFollow from './types/todo/social/follow';
export * as TodoSocialGetAuthorFeed from './types/todo/social/getAuthorFeed';
export * as TodoSocialGetHomeFeed from './types/todo/social/getHomeFeed';
export * as TodoSocialGetLikedBy from './types/todo/social/getLikedBy';
export * as TodoSocialGetNotificationCount from './types/todo/social/getNotificationCount';
export * as TodoSocialGetNotifications from './types/todo/social/getNotifications';
export * as TodoSocialGetPostThread from './types/todo/social/getPostThread';
export * as TodoSocialGetProfile from './types/todo/social/getProfile';
export * as TodoSocialGetRepostedBy from './types/todo/social/getRepostedBy';
export * as TodoSocialGetUserFollowers from './types/todo/social/getUserFollowers';
export * as TodoSocialGetUserFollows from './types/todo/social/getUserFollows';
export * as TodoSocialLike from './types/todo/social/like';
export * as TodoSocialMediaEmbed from './types/todo/social/mediaEmbed';
export * as TodoSocialPost from './types/todo/social/post';
export * as TodoSocialPostNotificationsSeen from './types/todo/social/postNotificationsSeen';
export * as TodoSocialProfile from './types/todo/social/profile';
export * as TodoSocialRepost from './types/todo/social/repost';
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
    todo: TodoNS;
    constructor(baseClient: Client, xrpcService: XrpcServiceClient);
    setHeader(key: string, value: string): void;
}
export declare class TodoNS {
    _service: ServiceClient;
    adx: AdxNS;
    social: SocialNS;
    constructor(service: ServiceClient);
}
export declare class AdxNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    createAccount(params: TodoAdxCreateAccount.QueryParams, data?: TodoAdxCreateAccount.InputSchema, opts?: TodoAdxCreateAccount.CallOptions): Promise<TodoAdxCreateAccount.Response>;
    createSession(params: TodoAdxCreateSession.QueryParams, data?: TodoAdxCreateSession.InputSchema, opts?: TodoAdxCreateSession.CallOptions): Promise<TodoAdxCreateSession.Response>;
    deleteAccount(params: TodoAdxDeleteAccount.QueryParams, data?: TodoAdxDeleteAccount.InputSchema, opts?: TodoAdxDeleteAccount.CallOptions): Promise<TodoAdxDeleteAccount.Response>;
    deleteSession(params: TodoAdxDeleteSession.QueryParams, data?: TodoAdxDeleteSession.InputSchema, opts?: TodoAdxDeleteSession.CallOptions): Promise<TodoAdxDeleteSession.Response>;
    getAccount(params: TodoAdxGetAccount.QueryParams, data?: TodoAdxGetAccount.InputSchema, opts?: TodoAdxGetAccount.CallOptions): Promise<TodoAdxGetAccount.Response>;
    getAccountsConfig(params: TodoAdxGetAccountsConfig.QueryParams, data?: TodoAdxGetAccountsConfig.InputSchema, opts?: TodoAdxGetAccountsConfig.CallOptions): Promise<TodoAdxGetAccountsConfig.Response>;
    getSession(params: TodoAdxGetSession.QueryParams, data?: TodoAdxGetSession.InputSchema, opts?: TodoAdxGetSession.CallOptions): Promise<TodoAdxGetSession.Response>;
    repoBatchWrite(params: TodoAdxRepoBatchWrite.QueryParams, data?: TodoAdxRepoBatchWrite.InputSchema, opts?: TodoAdxRepoBatchWrite.CallOptions): Promise<TodoAdxRepoBatchWrite.Response>;
    repoCreateRecord(params: TodoAdxRepoCreateRecord.QueryParams, data?: TodoAdxRepoCreateRecord.InputSchema, opts?: TodoAdxRepoCreateRecord.CallOptions): Promise<TodoAdxRepoCreateRecord.Response>;
    repoDeleteRecord(params: TodoAdxRepoDeleteRecord.QueryParams, data?: TodoAdxRepoDeleteRecord.InputSchema, opts?: TodoAdxRepoDeleteRecord.CallOptions): Promise<TodoAdxRepoDeleteRecord.Response>;
    repoDescribe(params: TodoAdxRepoDescribe.QueryParams, data?: TodoAdxRepoDescribe.InputSchema, opts?: TodoAdxRepoDescribe.CallOptions): Promise<TodoAdxRepoDescribe.Response>;
    repoGetRecord(params: TodoAdxRepoGetRecord.QueryParams, data?: TodoAdxRepoGetRecord.InputSchema, opts?: TodoAdxRepoGetRecord.CallOptions): Promise<TodoAdxRepoGetRecord.Response>;
    repoListRecords(params: TodoAdxRepoListRecords.QueryParams, data?: TodoAdxRepoListRecords.InputSchema, opts?: TodoAdxRepoListRecords.CallOptions): Promise<TodoAdxRepoListRecords.Response>;
    repoPutRecord(params: TodoAdxRepoPutRecord.QueryParams, data?: TodoAdxRepoPutRecord.InputSchema, opts?: TodoAdxRepoPutRecord.CallOptions): Promise<TodoAdxRepoPutRecord.Response>;
    resolveName(params: TodoAdxResolveName.QueryParams, data?: TodoAdxResolveName.InputSchema, opts?: TodoAdxResolveName.CallOptions): Promise<TodoAdxResolveName.Response>;
    syncGetRepo(params: TodoAdxSyncGetRepo.QueryParams, data?: TodoAdxSyncGetRepo.InputSchema, opts?: TodoAdxSyncGetRepo.CallOptions): Promise<TodoAdxSyncGetRepo.Response>;
    syncGetRoot(params: TodoAdxSyncGetRoot.QueryParams, data?: TodoAdxSyncGetRoot.InputSchema, opts?: TodoAdxSyncGetRoot.CallOptions): Promise<TodoAdxSyncGetRoot.Response>;
    syncUpdateRepo(params: TodoAdxSyncUpdateRepo.QueryParams, data?: TodoAdxSyncUpdateRepo.InputSchema, opts?: TodoAdxSyncUpdateRepo.CallOptions): Promise<TodoAdxSyncUpdateRepo.Response>;
}
export declare class SocialNS {
    _service: ServiceClient;
    badge: BadgeRecord;
    follow: FollowRecord;
    like: LikeRecord;
    mediaEmbed: MediaEmbedRecord;
    post: PostRecord;
    profile: ProfileRecord;
    repost: RepostRecord;
    constructor(service: ServiceClient);
    getAuthorFeed(params: TodoSocialGetAuthorFeed.QueryParams, data?: TodoSocialGetAuthorFeed.InputSchema, opts?: TodoSocialGetAuthorFeed.CallOptions): Promise<TodoSocialGetAuthorFeed.Response>;
    getHomeFeed(params: TodoSocialGetHomeFeed.QueryParams, data?: TodoSocialGetHomeFeed.InputSchema, opts?: TodoSocialGetHomeFeed.CallOptions): Promise<TodoSocialGetHomeFeed.Response>;
    getLikedBy(params: TodoSocialGetLikedBy.QueryParams, data?: TodoSocialGetLikedBy.InputSchema, opts?: TodoSocialGetLikedBy.CallOptions): Promise<TodoSocialGetLikedBy.Response>;
    getNotificationCount(params: TodoSocialGetNotificationCount.QueryParams, data?: TodoSocialGetNotificationCount.InputSchema, opts?: TodoSocialGetNotificationCount.CallOptions): Promise<TodoSocialGetNotificationCount.Response>;
    getNotifications(params: TodoSocialGetNotifications.QueryParams, data?: TodoSocialGetNotifications.InputSchema, opts?: TodoSocialGetNotifications.CallOptions): Promise<TodoSocialGetNotifications.Response>;
    getPostThread(params: TodoSocialGetPostThread.QueryParams, data?: TodoSocialGetPostThread.InputSchema, opts?: TodoSocialGetPostThread.CallOptions): Promise<TodoSocialGetPostThread.Response>;
    getProfile(params: TodoSocialGetProfile.QueryParams, data?: TodoSocialGetProfile.InputSchema, opts?: TodoSocialGetProfile.CallOptions): Promise<TodoSocialGetProfile.Response>;
    getRepostedBy(params: TodoSocialGetRepostedBy.QueryParams, data?: TodoSocialGetRepostedBy.InputSchema, opts?: TodoSocialGetRepostedBy.CallOptions): Promise<TodoSocialGetRepostedBy.Response>;
    getUserFollowers(params: TodoSocialGetUserFollowers.QueryParams, data?: TodoSocialGetUserFollowers.InputSchema, opts?: TodoSocialGetUserFollowers.CallOptions): Promise<TodoSocialGetUserFollowers.Response>;
    getUserFollows(params: TodoSocialGetUserFollows.QueryParams, data?: TodoSocialGetUserFollows.InputSchema, opts?: TodoSocialGetUserFollows.CallOptions): Promise<TodoSocialGetUserFollows.Response>;
    postNotificationsSeen(params: TodoSocialPostNotificationsSeen.QueryParams, data?: TodoSocialPostNotificationsSeen.InputSchema, opts?: TodoSocialPostNotificationsSeen.CallOptions): Promise<TodoSocialPostNotificationsSeen.Response>;
}
export declare class BadgeRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialBadge.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialBadge.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialBadge.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialBadge.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
export declare class FollowRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialFollow.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialFollow.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialFollow.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialFollow.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
export declare class LikeRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialLike.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialLike.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialLike.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialLike.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
export declare class MediaEmbedRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialMediaEmbed.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialMediaEmbed.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialMediaEmbed.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialMediaEmbed.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
export declare class PostRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialPost.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialPost.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialPost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialPost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
export declare class ProfileRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialProfile.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialProfile.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialProfile.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialProfile.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
export declare class RepostRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<TodoAdxRepoListRecords.QueryParams, 'type'>): Promise<{
        records: {
            uri: string;
            value: TodoSocialRepost.Record;
        }[];
    }>;
    get(params: Omit<TodoAdxRepoGetRecord.QueryParams, 'type'>): Promise<{
        uri: string;
        value: TodoSocialRepost.Record;
    }>;
    create(params: Omit<TodoAdxRepoCreateRecord.QueryParams, 'type'>, record: TodoSocialRepost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    put(params: Omit<TodoAdxRepoPutRecord.QueryParams, 'type'>, record: TodoSocialRepost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
    }>;
    delete(params: Omit<TodoAdxRepoDeleteRecord.QueryParams, 'type'>, headers?: Record<string, string>): Promise<void>;
}
