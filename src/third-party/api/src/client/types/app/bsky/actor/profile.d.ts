export interface Record {
    displayName: string;
    description?: string;
    avatar?: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    banner?: {
        cid: string;
        mimeType: string;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}
