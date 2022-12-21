import { Client as XrpcClient, ServiceClient as XrpcServiceClient } from '@atproto/xrpc';
import * as ComAtprotoAccountCreate from './types/com/atproto/account/create';
import * as ComAtprotoAccountCreateInviteCode from './types/com/atproto/account/createInviteCode';
import * as ComAtprotoAccountDelete from './types/com/atproto/account/delete';
import * as ComAtprotoAccountGet from './types/com/atproto/account/get';
import * as ComAtprotoAccountRequestPasswordReset from './types/com/atproto/account/requestPasswordReset';
import * as ComAtprotoAccountResetPassword from './types/com/atproto/account/resetPassword';
import * as ComAtprotoBlobUpload from './types/com/atproto/blob/upload';
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
import * as AppBskyActorCreateScene from './types/app/bsky/actor/createScene';
import * as AppBskyActorGetProfile from './types/app/bsky/actor/getProfile';
import * as AppBskyActorGetSuggestions from './types/app/bsky/actor/getSuggestions';
import * as AppBskyActorProfile from './types/app/bsky/actor/profile';
import * as AppBskyActorSearch from './types/app/bsky/actor/search';
import * as AppBskyActorSearchTypeahead from './types/app/bsky/actor/searchTypeahead';
import * as AppBskyActorUpdateProfile from './types/app/bsky/actor/updateProfile';
import * as AppBskyFeedGetAuthorFeed from './types/app/bsky/feed/getAuthorFeed';
import * as AppBskyFeedGetPostThread from './types/app/bsky/feed/getPostThread';
import * as AppBskyFeedGetRepostedBy from './types/app/bsky/feed/getRepostedBy';
import * as AppBskyFeedGetTimeline from './types/app/bsky/feed/getTimeline';
import * as AppBskyFeedGetVotes from './types/app/bsky/feed/getVotes';
import * as AppBskyFeedPost from './types/app/bsky/feed/post';
import * as AppBskyFeedRepost from './types/app/bsky/feed/repost';
import * as AppBskyFeedSetVote from './types/app/bsky/feed/setVote';
import * as AppBskyFeedTrend from './types/app/bsky/feed/trend';
import * as AppBskyFeedVote from './types/app/bsky/feed/vote';
import * as AppBskyGraphAssertion from './types/app/bsky/graph/assertion';
import * as AppBskyGraphConfirmation from './types/app/bsky/graph/confirmation';
import * as AppBskyGraphFollow from './types/app/bsky/graph/follow';
import * as AppBskyGraphGetAssertions from './types/app/bsky/graph/getAssertions';
import * as AppBskyGraphGetFollowers from './types/app/bsky/graph/getFollowers';
import * as AppBskyGraphGetFollows from './types/app/bsky/graph/getFollows';
import * as AppBskyGraphGetMembers from './types/app/bsky/graph/getMembers';
import * as AppBskyGraphGetMemberships from './types/app/bsky/graph/getMemberships';
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
export * as ComAtprotoBlobUpload from './types/com/atproto/blob/upload';
export * as ComAtprotoHandleResolve from './types/com/atproto/handle/resolve';
export * as ComAtprotoRepoBatchWrite from './types/com/atproto/repo/batchWrite';
export * as ComAtprotoRepoCreateRecord from './types/com/atproto/repo/createRecord';
export * as ComAtprotoRepoDeleteRecord from './types/com/atproto/repo/deleteRecord';
export * as ComAtprotoRepoDescribe from './types/com/atproto/repo/describe';
export * as ComAtprotoRepoGetRecord from './types/com/atproto/repo/getRecord';
export * as ComAtprotoRepoListRecords from './types/com/atproto/repo/listRecords';
export * as ComAtprotoRepoPutRecord from './types/com/atproto/repo/putRecord';
export * as ComAtprotoRepoStrongRef from './types/com/atproto/repo/strongRef';
export * as ComAtprotoServerGetAccountsConfig from './types/com/atproto/server/getAccountsConfig';
export * as ComAtprotoSessionCreate from './types/com/atproto/session/create';
export * as ComAtprotoSessionDelete from './types/com/atproto/session/delete';
export * as ComAtprotoSessionGet from './types/com/atproto/session/get';
export * as ComAtprotoSessionRefresh from './types/com/atproto/session/refresh';
export * as ComAtprotoSyncGetRepo from './types/com/atproto/sync/getRepo';
export * as ComAtprotoSyncGetRoot from './types/com/atproto/sync/getRoot';
export * as ComAtprotoSyncUpdateRepo from './types/com/atproto/sync/updateRepo';
export * as AppBskyActorCreateScene from './types/app/bsky/actor/createScene';
export * as AppBskyActorGetProfile from './types/app/bsky/actor/getProfile';
export * as AppBskyActorGetSuggestions from './types/app/bsky/actor/getSuggestions';
export * as AppBskyActorProfile from './types/app/bsky/actor/profile';
export * as AppBskyActorRef from './types/app/bsky/actor/ref';
export * as AppBskyActorSearch from './types/app/bsky/actor/search';
export * as AppBskyActorSearchTypeahead from './types/app/bsky/actor/searchTypeahead';
export * as AppBskyActorUpdateProfile from './types/app/bsky/actor/updateProfile';
export * as AppBskyEmbedExternal from './types/app/bsky/embed/external';
export * as AppBskyEmbedImages from './types/app/bsky/embed/images';
export * as AppBskyFeedFeedViewPost from './types/app/bsky/feed/feedViewPost';
export * as AppBskyFeedGetAuthorFeed from './types/app/bsky/feed/getAuthorFeed';
export * as AppBskyFeedGetPostThread from './types/app/bsky/feed/getPostThread';
export * as AppBskyFeedGetRepostedBy from './types/app/bsky/feed/getRepostedBy';
export * as AppBskyFeedGetTimeline from './types/app/bsky/feed/getTimeline';
export * as AppBskyFeedGetVotes from './types/app/bsky/feed/getVotes';
export * as AppBskyFeedPost from './types/app/bsky/feed/post';
export * as AppBskyFeedRepost from './types/app/bsky/feed/repost';
export * as AppBskyFeedSetVote from './types/app/bsky/feed/setVote';
export * as AppBskyFeedTrend from './types/app/bsky/feed/trend';
export * as AppBskyFeedVote from './types/app/bsky/feed/vote';
export * as AppBskyGraphAssertCreator from './types/app/bsky/graph/assertCreator';
export * as AppBskyGraphAssertMember from './types/app/bsky/graph/assertMember';
export * as AppBskyGraphAssertion from './types/app/bsky/graph/assertion';
export * as AppBskyGraphConfirmation from './types/app/bsky/graph/confirmation';
export * as AppBskyGraphFollow from './types/app/bsky/graph/follow';
export * as AppBskyGraphGetAssertions from './types/app/bsky/graph/getAssertions';
export * as AppBskyGraphGetFollowers from './types/app/bsky/graph/getFollowers';
export * as AppBskyGraphGetFollows from './types/app/bsky/graph/getFollows';
export * as AppBskyGraphGetMembers from './types/app/bsky/graph/getMembers';
export * as AppBskyGraphGetMemberships from './types/app/bsky/graph/getMemberships';
export * as AppBskyNotificationGetCount from './types/app/bsky/notification/getCount';
export * as AppBskyNotificationList from './types/app/bsky/notification/list';
export * as AppBskyNotificationUpdateSeen from './types/app/bsky/notification/updateSeen';
export * as AppBskySystemActorScene from './types/app/bsky/system/actorScene';
export * as AppBskySystemActorUser from './types/app/bsky/system/actorUser';
export * as AppBskySystemDeclRef from './types/app/bsky/system/declRef';
export * as AppBskySystemDeclaration from './types/app/bsky/system/declaration';
export declare const APP_BSKY_GRAPH: {
    AssertCreator: string;
    AssertMember: string;
};
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
    blob: BlobNS;
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
export declare class BlobNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    upload(data?: ComAtprotoBlobUpload.InputSchema, opts?: ComAtprotoBlobUpload.CallOptions): Promise<ComAtprotoBlobUpload.Response>;
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
    embed: EmbedNS;
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
    createScene(data?: AppBskyActorCreateScene.InputSchema, opts?: AppBskyActorCreateScene.CallOptions): Promise<AppBskyActorCreateScene.Response>;
    getProfile(params?: AppBskyActorGetProfile.QueryParams, opts?: AppBskyActorGetProfile.CallOptions): Promise<AppBskyActorGetProfile.Response>;
    getSuggestions(params?: AppBskyActorGetSuggestions.QueryParams, opts?: AppBskyActorGetSuggestions.CallOptions): Promise<AppBskyActorGetSuggestions.Response>;
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
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class EmbedNS {
    _service: ServiceClient;
    constructor(service: ServiceClient);
}
export declare class FeedNS {
    _service: ServiceClient;
    post: PostRecord;
    repost: RepostRecord;
    trend: TrendRecord;
    vote: VoteRecord;
    constructor(service: ServiceClient);
    getAuthorFeed(params?: AppBskyFeedGetAuthorFeed.QueryParams, opts?: AppBskyFeedGetAuthorFeed.CallOptions): Promise<AppBskyFeedGetAuthorFeed.Response>;
    getPostThread(params?: AppBskyFeedGetPostThread.QueryParams, opts?: AppBskyFeedGetPostThread.CallOptions): Promise<AppBskyFeedGetPostThread.Response>;
    getRepostedBy(params?: AppBskyFeedGetRepostedBy.QueryParams, opts?: AppBskyFeedGetRepostedBy.CallOptions): Promise<AppBskyFeedGetRepostedBy.Response>;
    getTimeline(params?: AppBskyFeedGetTimeline.QueryParams, opts?: AppBskyFeedGetTimeline.CallOptions): Promise<AppBskyFeedGetTimeline.Response>;
    getVotes(params?: AppBskyFeedGetVotes.QueryParams, opts?: AppBskyFeedGetVotes.CallOptions): Promise<AppBskyFeedGetVotes.Response>;
    setVote(data?: AppBskyFeedSetVote.InputSchema, opts?: AppBskyFeedSetVote.CallOptions): Promise<AppBskyFeedSetVote.Response>;
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
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
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
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class TrendRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyFeedTrend.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFeedTrend.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyFeedTrend.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class VoteRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyFeedVote.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyFeedVote.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyFeedVote.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class GraphNS {
    _service: ServiceClient;
    assertion: AssertionRecord;
    confirmation: ConfirmationRecord;
    follow: FollowRecord;
    constructor(service: ServiceClient);
    getAssertions(params?: AppBskyGraphGetAssertions.QueryParams, opts?: AppBskyGraphGetAssertions.CallOptions): Promise<AppBskyGraphGetAssertions.Response>;
    getFollowers(params?: AppBskyGraphGetFollowers.QueryParams, opts?: AppBskyGraphGetFollowers.CallOptions): Promise<AppBskyGraphGetFollowers.Response>;
    getFollows(params?: AppBskyGraphGetFollows.QueryParams, opts?: AppBskyGraphGetFollows.CallOptions): Promise<AppBskyGraphGetFollows.Response>;
    getMembers(params?: AppBskyGraphGetMembers.QueryParams, opts?: AppBskyGraphGetMembers.CallOptions): Promise<AppBskyGraphGetMembers.Response>;
    getMemberships(params?: AppBskyGraphGetMemberships.QueryParams, opts?: AppBskyGraphGetMemberships.CallOptions): Promise<AppBskyGraphGetMemberships.Response>;
}
export declare class AssertionRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyGraphAssertion.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyGraphAssertion.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyGraphAssertion.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
export declare class ConfirmationRecord {
    _service: ServiceClient;
    constructor(service: ServiceClient);
    list(params: Omit<ComAtprotoRepoListRecords.QueryParams, 'collection'>): Promise<{
        cursor?: string;
        records: {
            uri: string;
            value: AppBskyGraphConfirmation.Record;
        }[];
    }>;
    get(params: Omit<ComAtprotoRepoGetRecord.QueryParams, 'collection'>): Promise<{
        uri: string;
        cid: string;
        value: AppBskyGraphConfirmation.Record;
    }>;
    create(params: Omit<ComAtprotoRepoCreateRecord.InputSchema, 'collection' | 'record'>, record: AppBskyGraphConfirmation.Record, headers?: Record<string, string>): Promise<{
        uri: string;
        cid: string;
    }>;
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
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
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
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
    delete(params: Omit<ComAtprotoRepoDeleteRecord.InputSchema, 'collection'>, headers?: Record<string, string>): Promise<void>;
}
