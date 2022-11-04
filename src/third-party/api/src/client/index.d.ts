import { Client as XrpcClient, ServiceClient as XrpcServiceClient } from '@atproto/xrpc';
import * as ComAtprotoAccountCreate from './types/com/atproto/account/create';
import * as ComAtprotoAccountCreateInviteCode from './types/com/atproto/account/createInviteCode';
import * as ComAtprotoAccountDelete from './types/com/atproto/account/delete';
import * as ComAtprotoAccountGet from './types/com/atproto/account/get';
import * as ComAtprotoAccountRequestPasswordReset from './types/com/atproto/account/requestPasswordReset';
import * as ComAtprotoAccountResetPassword from './types/com/atproto/account/resetPassword';
import * as ComAtprotoHandleResolve from './types/com/atproto/handle/resolve';
import * as ComAtprotoRepoBatchWrite from './types/com/atproto/repo/batchWrite';
import * as ComAtprotoRepoCreateRecord from './types/com/atproto/repo/createRecord';
import * as ComAtprotoRepoDeleteRecord from './types/com/atproto/repo/deleteRecord';
import * as ComAtprotoRepoDescribe from './types/com/atproto/repo/describe';
import * as ComAtprotoRepoGetRecord from './types/com/atproto/repo/getRecord';
import * as ComAtprotoRepoListRecords from './types/com/atproto/repo/listRecords';
import * as ComAtprotoRepoPutRecord from './types/com/atproto/repo/putRecord';
import * as ComAtprotoServerGetAccountsConfig from './types/com/atproto/server/getAccountsConfig';
import * as ComAtprotoSessionCreate from './types/com/atproto/session/create';
import * as ComAtprotoSessionDelete from './types/com/atproto/session/delete';
import * as ComAtprotoSessionGet from './types/com/atproto/session/get';
import * as ComAtprotoSessionRefresh from './types/com/atproto/session/refresh';
import * as ComAtprotoSyncGetRepo from './types/com/atproto/sync/getRepo';
import * as ComAtprotoSyncGetRoot from './types/com/atproto/sync/getRoot';
import * as ComAtprotoSyncUpdateRepo from './types/com/atproto/sync/updateRepo';
import * as AppBskyActorGetProfile from './types/app/bsky/actor/getProfile';
import * as AppBskyActorSearch from './types/app/bsky/actor/search';
import * as AppBskyActorSearchTypeahead from './types/app/bsky/actor/searchTypeahead';
import * as AppBskyActorProfile from './types/app/bsky/actor/profile';
import * as AppBskyActorUpdateProfile from './types/app/bsky/actor/updateProfile';
import * as AppBskyFeedGetAuthorFeed from './types/app/bsky/feed/getAuthorFeed';
import * as AppBskyFeedGetLikedBy from './types/app/bsky/feed/getLikedBy';
import * as AppBskyFeedGetPostThread from './types/app/bsky/feed/getPostThread';
import * as AppBskyFeedGetRepostedBy from './types/app/bsky/feed/getRepostedBy';
import * as AppBskyFeedGetTimeline from './types/app/bsky/feed/getTimeline';
import * as AppBskyFeedLike from './types/app/bsky/feed/like';
import * as AppBskyFeedMediaEmbed from './types/app/bsky/feed/mediaEmbed';
import * as AppBskyFeedPost from './types/app/bsky/feed/post';
import * as AppBskyFeedRepost from './types/app/bsky/feed/repost';
import * as AppBskyGraphFollow from './types/app/bsky/graph/follow';
import * as AppBskyGraphGetFollowers from './types/app/bsky/graph/getFollowers';
import * as AppBskyGraphGetFollows from './types/app/bsky/graph/getFollows';
import * as AppBskyGraphInvite from './types/app/bsky/graph/invite';
import * as AppBskyGraphInviteAccept from './types/app/bsky/graph/inviteAccept';
import * as AppBskyNotificationGetCount from './types/app/bsky/notification/getCount';
import * as AppBskyNotificationList from './types/app/bsky/notification/list';
import * as AppBskyNotificationUpdateSeen from './types/app/bsky/notification/updateSeen';
import * as AppBskySystemDeclaration from './types/app/bsky/system/declaration';
export * as ComAtprotoAccountCreate from './types/com/atproto/account/create';
export * as ComAtprotoAccountCreateInviteCode from './types/com/atproto/account/createInviteCode';
export * as ComAtprotoAccountDelete from './types/com/atproto/account/delete';
export * as ComAtprotoAccountGet from './types/com/atproto/account/get';
export * as ComAtprotoAccountRequestPasswordReset from './types/com/atproto/account/requestPasswordReset';
export * as ComAtprotoAccountResetPassword from './types/com/atproto/account/resetPassword';
export * as ComAtprotoHandleResolve from './types/com/atproto/handle/resolve';
export * as ComAtprotoRepoBatchWrite from './types/com/atproto/repo/batchWrite';
export * as ComAtprotoRepoCreateRecord from './types/com/atproto/repo/createRecord';
export * as ComAtprotoRepoDeleteRecord from './types/com/atproto/repo/deleteRecord';
export * as ComAtprotoRepoDescribe from './types/com/atproto/repo/describe';
export * as ComAtprotoRepoGetRecord from './types/com/atproto/repo/getRecord';
export * as ComAtprotoRepoListRecords from './types/com/atproto/repo/listRecords';
export * as ComAtprotoRepoPutRecord from './types/com/atproto/repo/putRecord';
export * as ComAtprotoServerGetAccountsConfig from './types/com/atproto/server/getAccountsConfig';
export * as ComAtprotoSessionCreate from './types/com/atproto/session/create';
export * as ComAtprotoSessionDelete from './types/com/atproto/session/delete';
export * as ComAtprotoSessionGet from './types/com/atproto/session/get';
export * as ComAtprotoSessionRefresh from './types/com/atproto/session/refresh';
export * as ComAtprotoSyncGetRepo from './types/com/atproto/sync/getRepo';
export * as ComAtprotoSyncGetRoot from './types/com/atproto/sync/getRoot';
export * as ComAtprotoSyncUpdateRepo from './types/com/atproto/sync/updateRepo';
export * as AppBskyActorGetProfile from './types/app/bsky/actor/getProfile';
export * as AppBskyActorSearch from './types/app/bsky/actor/search';
export * as AppBskyActorSearchTypeahead from './types/app/bsky/actor/searchTypeahead';
export * as AppBskyActorProfile from './types/app/bsky/actor/profile';
export * as AppBskyActorUpdateProfile from './types/app/bsky/actor/updateProfile';
export * as AppBskyFeedGetAuthorFeed from './types/app/bsky/feed/getAuthorFeed';
export * as AppBskyFeedGetLikedBy from './types/app/bsky/feed/getLikedBy';
export * as AppBskyFeedGetPostThread from './types/app/bsky/feed/getPostThread';
export * as AppBskyFeedGetRepostedBy from './types/app/bsky/feed/getRepostedBy';
export * as AppBskyFeedGetTimeline from './types/app/bsky/feed/getTimeline';
export * as AppBskyFeedLike from './types/app/bsky/feed/like';
export * as AppBskyFeedMediaEmbed from './types/app/bsky/feed/mediaEmbed';
export * as AppBskyFeedPost from './types/app/bsky/feed/post';
export * as AppBskyFeedRepost from './types/app/bsky/feed/repost';
export * as AppBskyGraphFollow from './types/app/bsky/graph/follow';
export * as AppBskyGraphGetFollowers from './types/app/bsky/graph/getFollowers';
export * as AppBskyGraphGetFollows from './types/app/bsky/graph/getFollows';
export * as AppBskyGraphInvite from './types/app/bsky/graph/invite';
export * as AppBskyGraphInviteAccept from './types/app/bsky/graph/inviteAccept';
export * as AppBskyNotificationGetCount from './types/app/bsky/notification/getCount';
export * as AppBskyNotificationList from './types/app/bsky/notification/list';
export * as AppBskyNotificationUpdateSeen from './types/app/bsky/notification/updateSeen';
export * as AppBskySystemDeclaration from './types/app/bsky/system/declaration';
export declare const APP_BSKY_SYSTEM: {
    ActorScene: string;
    ActorUser: string;
};
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
    account: AccountNS;
    handle: HandleNS;
    repo: RepoNS;
    server: ServerNS;
    session: SessionNS;
    sync: SyncNS;
    constructor(service: ServiceClient);
}
export declare class AccountNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    create(data?: ComAtprotoAccountCreate.InputSchema, opts?: ComAtprotoAccountCreate.CallOptions): Promise<ComAtprotoAccountCreate.Response>;
    createInviteCode(data?: ComAtprotoAccountCreateInviteCode.InputSchema, opts?: ComAtprotoAccountCreateInviteCode.CallOptions): Promise<ComAtprotoAccountCreateInviteCode.Response>;
    delete(data?: ComAtprotoAccountDelete.InputSchema, opts?: ComAtprotoAccountDelete.CallOptions): Promise<ComAtprotoAccountDelete.Response>;
    get(params?: ComAtprotoAccountGet.QueryParams, opts?: ComAtprotoAccountGet.CallOptions): Promise<ComAtprotoAccountGet.Response>;
    requestPasswordReset(data?: ComAtprotoAccountRequestPasswordReset.InputSchema, opts?: ComAtprotoAccountRequestPasswordReset.CallOptions): Promise<ComAtprotoAccountRequestPasswordReset.Response>;
    resetPassword(data?: ComAtprotoAccountResetPassword.InputSchema, opts?: ComAtprotoAccountResetPassword.CallOptions): Promise<ComAtprotoAccountResetPassword.Response>;
}
export declare class HandleNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    resolve(params?: ComAtprotoHandleResolve.QueryParams, opts?: ComAtprotoHandleResolve.CallOptions): Promise<ComAtprotoHandleResolve.Response>;
}
export declare class RepoNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    batchWrite(data?: ComAtprotoRepoBatchWrite.InputSchema, opts?: ComAtprotoRepoBatchWrite.CallOptions): Promise<ComAtprotoRepoBatchWrite.Response>;
    createRecord(data?: ComAtprotoRepoCreateRecord.InputSchema, opts?: ComAtprotoRepoCreateRecord.CallOptions): Promise<ComAtprotoRepoCreateRecord.Response>;
    deleteRecord(data?: ComAtprotoRepoDeleteRecord.InputSchema, opts?: ComAtprotoRepoDeleteRecord.CallOptions): Promise<ComAtprotoRepoDeleteRecord.Response>;
    describe(params?: ComAtprotoRepoDescribe.QueryParams, opts?: ComAtprotoRepoDescribe.CallOptions): Promise<ComAtprotoRepoDescribe.Response>;
    getRecord(params?: ComAtprotoRepoGetRecord.QueryParams, opts?: ComAtprotoRepoGetRecord.CallOptions): Promise<ComAtprotoRepoGetRecord.Response>;
    listRecords(params?: ComAtprotoRepoListRecords.QueryParams, opts?: ComAtprotoRepoListRecords.CallOptions): Promise<ComAtprotoRepoListRecords.Response>;
    putRecord(data?: ComAtprotoRepoPutRecord.InputSchema, opts?: ComAtprotoRepoPutRecord.CallOptions): Promise<ComAtprotoRepoPutRecord.Response>;
}
export declare class ServerNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    getAccountsConfig(params?: ComAtprotoServerGetAccountsConfig.QueryParams, opts?: ComAtprotoServerGetAccountsConfig.CallOptions): Promise<ComAtprotoServerGetAccountsConfig.Response>;
}
export declare class SessionNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    create(data?: ComAtprotoSessionCreate.InputSchema, opts?: ComAtprotoSessionCreate.CallOptions): Promise<ComAtprotoSessionCreate.Response>;
    delete(data?: ComAtprotoSessionDelete.InputSchema, opts?: ComAtprotoSessionDelete.CallOptions): Promise<ComAtprotoSessionDelete.Response>;
    get(params?: ComAtprotoSessionGet.QueryParams, opts?: ComAtprotoSessionGet.CallOptions): Promise<ComAtprotoSessionGet.Response>;
    refresh(data?: ComAtprotoSessionRefresh.InputSchema, opts?: ComAtprotoSessionRefresh.CallOptions): Promise<ComAtprotoSessionRefresh.Response>;
}
export declare class SyncNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    getRepo(params?: ComAtprotoSyncGetRepo.QueryParams, opts?: ComAtprotoSyncGetRepo.CallOptions): Promise<ComAtprotoSyncGetRepo.Response>;
    getRoot(params?: ComAtprotoSyncGetRoot.QueryParams, opts?: ComAtprotoSyncGetRoot.CallOptions): Promise<ComAtprotoSyncGetRoot.Response>;
    updateRepo(data?: ComAtprotoSyncUpdateRepo.InputSchema, opts?: ComAtprotoSyncUpdateRepo.CallOptions): Promise<ComAtprotoSyncUpdateRepo.Response>;
}
export declare class AppNS {
    _service: ServiceClient;
    bsky: BskyNS;
    constructor(service: ServiceClient);
}
export declare class BskyNS {
    _service: ServiceClient;
    actor: ActorNS;
    feed: FeedNS;
    graph: GraphNS;
    notification: NotificationNS;
    system: SystemNS;
    constructor(service: ServiceClient);
}
export declare class ActorNS {
    _service: ServiceClient;
    profile: ProfileRecord;
    constructor(service: ServiceClient);
    getProfile(params?: AppBskyActorGetProfile.QueryParams, opts?: AppBskyActorGetProfile.CallOptions): Promise<AppBskyActorGetProfile.Response>;
    search(params?: AppBskyActorSearch.QueryParams, opts?: AppBskyActorSearch.CallOptions): Promise<AppBskyActorSearch.Response>;
    searchTypeahead(params?: AppBskyActorSearchTypeahead.QueryParams, opts?: AppBskyActorSearchTypeahead.CallOptions): Promise<AppBskyActorSearchTypeahead.Response>;
    updateProfile(data?: AppBskyActorUpdateProfile.InputSchema, opts?: AppBskyActorUpdateProfile.CallOptions): Promise<AppBskyActorUpdateProfile.Response>;
}
export declare class ProfileRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyActorProfile.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyActorProfile.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyActorProfile.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class FeedNS {
    _service: ServiceClient;
    like: LikeRecord;
    mediaEmbed: MediaEmbedRecord;
    post: PostRecord;
    repost: RepostRecord;
    constructor(service: ServiceClient);
    getAuthorFeed(params?: AppBskyFeedGetAuthorFeed.QueryParams, opts?: AppBskyFeedGetAuthorFeed.CallOptions): Promise<AppBskyFeedGetAuthorFeed.Response>;
    getLikedBy(params?: AppBskyFeedGetLikedBy.QueryParams, opts?: AppBskyFeedGetLikedBy.CallOptions): Promise<AppBskyFeedGetLikedBy.Response>;
    getPostThread(params?: AppBskyFeedGetPostThread.QueryParams, opts?: AppBskyFeedGetPostThread.CallOptions): Promise<AppBskyFeedGetPostThread.Response>;
    getRepostedBy(params?: AppBskyFeedGetRepostedBy.QueryParams, opts?: AppBskyFeedGetRepostedBy.CallOptions): Promise<AppBskyFeedGetRepostedBy.Response>;
    getTimeline(params?: AppBskyFeedGetTimeline.QueryParams, opts?: AppBskyFeedGetTimeline.CallOptions): Promise<AppBskyFeedGetTimeline.Response>;
}
export declare class LikeRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyFeedLike.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFeedLike.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyFeedLike.Record, headers?: Record<string, string>): Promise<{
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
            value: AppBskyFeedMediaEmbed.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFeedMediaEmbed.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyFeedMediaEmbed.Record, headers?: Record<string, string>): Promise<{
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
            value: AppBskyFeedPost.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFeedPost.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyFeedPost.Record, headers?: Record<string, string>): Promise<{
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
            value: AppBskyFeedRepost.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFeedRepost.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyFeedRepost.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class GraphNS {
    _service: ServiceClient;
    follow: FollowRecord;
    invite: InviteRecord;
    inviteAccept: InviteAcceptRecord;
    constructor(service: ServiceClient);
    getFollowers(params?: AppBskyGraphGetFollowers.QueryParams, opts?: AppBskyGraphGetFollowers.CallOptions): Promise<AppBskyGraphGetFollowers.Response>;
    getFollows(params?: AppBskyGraphGetFollows.QueryParams, opts?: AppBskyGraphGetFollows.CallOptions): Promise<AppBskyGraphGetFollows.Response>;
}
export declare class FollowRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyGraphFollow.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyGraphFollow.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyGraphFollow.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class InviteRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyGraphInvite.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyGraphInvite.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyGraphInvite.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class InviteAcceptRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyGraphInviteAccept.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyGraphInviteAccept.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyGraphInviteAccept.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class NotificationNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    getCount(params?: AppBskyNotificationGetCount.QueryParams, opts?: AppBskyNotificationGetCount.CallOptions): Promise<AppBskyNotificationGetCount.Response>;
    list(params?: AppBskyNotificationList.QueryParams, opts?: AppBskyNotificationList.CallOptions): Promise<AppBskyNotificationList.Response>;
    updateSeen(data?: AppBskyNotificationUpdateSeen.InputSchema, opts?: AppBskyNotificationUpdateSeen.CallOptions): Promise<AppBskyNotificationUpdateSeen.Response>;
}
export declare class SystemNS {
    _service: ServiceClient;
    declaration: DeclarationRecord;
    constructor(service: ServiceClient);
}
export declare class DeclarationRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskySystemDeclaration.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskySystemDeclaration.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskySystemDeclaration.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.QueryParams, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
