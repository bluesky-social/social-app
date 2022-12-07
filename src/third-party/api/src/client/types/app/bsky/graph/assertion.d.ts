import * as AppBskyActorRef from '../actor/ref';
export interface Record {
    assertion: string;
    subject: AppBskyActorRef.Main;
    createdAt: string;
    [k: string]: unknown;
}
