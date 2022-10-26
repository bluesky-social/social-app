export interface Record {
    badge: Subject;
    offer: Subject;
    createdAt: string;
    [k: string]: unknown;
}
export interface Subject {
    uri: string;
    cid: string;
    [k: string]: unknown;
}
