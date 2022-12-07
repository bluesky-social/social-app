import * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef';
export interface Record {
    subject: ComAtprotoRepoStrongRef.Main;
    direction: 'up' | 'down';
    createdAt: string;
    [k: string]: unknown;
}
