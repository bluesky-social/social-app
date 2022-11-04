export declare type ActorKnown = 'app.bsky.system.actorUser' | 'app.bsky.system.actorScene';
export declare type ActorUnknown = string;
export interface Record {
    actorType: ActorKnown | ActorUnknown;
    [k: string]: unknown;
}
