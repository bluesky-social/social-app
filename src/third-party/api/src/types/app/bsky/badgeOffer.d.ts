export interface Record {
    badge: Badge;
    subject: string;
    createdAt: string;
    [k: string]: unknown;
}
export interface Badge {
    uri: string;
    cid: string;
    [k: string]: unknown;
}
