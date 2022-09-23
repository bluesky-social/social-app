export interface Record {
    displayName: string;
    description?: string;
    badges?: BadgeRef[];
    [k: string]: unknown;
}
export interface BadgeRef {
    uri: string;
    [k: string]: unknown;
}
