export interface Main {
    cid: string;
    actorType: 'app.bsky.system.actorUser' | 'app.bsky.system.actorScene' | (string & {});
    [k: string]: unknown;
}
