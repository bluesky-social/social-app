import { z } from 'zod';
export declare const getRepoRequest: z.ZodObject<{
    did: z.ZodString;
    from: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, import("multiformats/cid").CID, string>>;
}, "strip", z.ZodTypeAny, {
    from?: import("multiformats/cid").CID | undefined;
    did: string;
}, {
    from?: string | undefined;
    did: string;
}>;
export declare type GetRepoRequest = z.infer<typeof getRepoRequest>;
export declare const postRepoRequest: z.ZodObject<{
    did: z.ZodString;
}, "strip", z.ZodTypeAny, {
    did: string;
}, {
    did: string;
}>;
export declare type PostRepoRequest = z.infer<typeof postRepoRequest>;
export declare const describeRepoParams: z.ZodObject<{
    confirmName: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    confirmName?: boolean | undefined;
}, {
    confirmName?: boolean | undefined;
}>;
export declare type DescribeRepoParams = z.infer<typeof describeRepoParams>;
export declare const describeRepoResponse: z.ZodObject<{
    name: z.ZodString;
    did: z.ZodString;
    didDoc: z.ZodAny;
    collections: z.ZodArray<z.ZodString, "many">;
    nameIsCorrect: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    didDoc?: any;
    nameIsCorrect?: boolean | undefined;
    name: string;
    did: string;
    collections: string[];
}, {
    didDoc?: any;
    nameIsCorrect?: boolean | undefined;
    name: string;
    did: string;
    collections: string[];
}>;
export declare type DescribeRepoResponse = z.infer<typeof describeRepoResponse>;
export declare const listRecordsParams: z.ZodObject<{
    limit: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, number, string>]>>;
    before: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodString>;
    reverse: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    reverse?: boolean | undefined;
    limit?: number | undefined;
    before?: string | undefined;
    after?: string | undefined;
}, {
    reverse?: string | undefined;
    limit?: string | number | undefined;
    before?: string | undefined;
    after?: string | undefined;
}>;
export declare type ListRecordsParams = z.infer<typeof listRecordsParams>;
export declare const listRecordsResponse: z.ZodObject<{
    records: z.ZodArray<z.ZodObject<{
        uri: z.ZodString;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        uri: string;
    }, {
        value?: any;
        uri: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    records: {
        value?: any;
        uri: string;
    }[];
}, {
    records: {
        value?: any;
        uri: string;
    }[];
}>;
export declare type ListRecordsResponse = z.infer<typeof listRecordsResponse>;
export declare const getRecordResponse: z.ZodObject<{
    uri: z.ZodString;
    value: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    value?: any;
    uri: string;
}, {
    value?: any;
    uri: string;
}>;
export declare type GetRecordResponse = z.infer<typeof getRecordResponse>;
export declare const batchWriteParams: z.ZodObject<{
    writes: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        action: z.ZodLiteral<"create">;
        collection: z.ZodString;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        action: "create";
        collection: string;
    }, {
        value?: any;
        action: "create";
        collection: string;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"update">;
        collection: z.ZodString;
        tid: z.ZodString;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        action: "update";
        collection: string;
        tid: string;
    }, {
        value?: any;
        action: "update";
        collection: string;
        tid: string;
    }>, z.ZodObject<{
        action: z.ZodLiteral<"delete">;
        collection: z.ZodString;
        tid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        action: "delete";
        collection: string;
        tid: string;
    }, {
        action: "delete";
        collection: string;
        tid: string;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    writes: ({
        value?: any;
        action: "create";
        collection: string;
    } | {
        value?: any;
        action: "update";
        collection: string;
        tid: string;
    } | {
        action: "delete";
        collection: string;
        tid: string;
    })[];
}, {
    writes: ({
        value?: any;
        action: "create";
        collection: string;
    } | {
        value?: any;
        action: "update";
        collection: string;
        tid: string;
    } | {
        action: "delete";
        collection: string;
        tid: string;
    })[];
}>;
export declare type BatchWriteParams = z.infer<typeof batchWriteParams>;
export declare const createRecordResponse: z.ZodObject<{
    uri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uri: string;
}, {
    uri: string;
}>;
export declare type CreateRecordResponse = z.infer<typeof createRecordResponse>;
