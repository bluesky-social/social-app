import * as AppBskyActorRef from '../actor/ref';
export interface Record {
    subject: AppBskyActorRef.Main;
    createdAt: string;
    [k: string]: unknown;
}
