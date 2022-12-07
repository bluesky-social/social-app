import * as AppBskyActorRef from '../actor/ref';
import * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef';
export interface Record {
    originator: AppBskyActorRef.Main;
    assertion: ComAtprotoRepoStrongRef.Main;
    createdAt: string;
    [k: string]: unknown;
}
