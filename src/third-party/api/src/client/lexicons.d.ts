import { LexiconDoc, Lexicons } from '@atproto/lexicon';
export declare const schemaDict: {
    ComAtprotoAccountCreate: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            email: {
                                type: string;
                            };
                            handle: {
                                type: string;
                            };
                            inviteCode: {
                                type: string;
                            };
                            password: {
                                type: string;
                            };
                            recoveryKey: {
                                type: string;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            accessJwt: {
                                type: string;
                            };
                            refreshJwt: {
                                type: string;
                            };
                            handle: {
                                type: string;
                            };
                            did: {
                                type: string;
                            };
                        };
                    };
                };
                errors: {
                    name: string;
                }[];
            };
        };
    };
    ComAtprotoAccountCreateInviteCode: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            useCount: {
                                type: string;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            code: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoAccountDelete: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    ComAtprotoAccountGet: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    ComAtprotoAccountRequestPasswordReset: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            email: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoAccountResetPassword: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            token: {
                                type: string;
                            };
                            password: {
                                type: string;
                            };
                        };
                    };
                };
                errors: {
                    name: string;
                }[];
            };
        };
    };
    ComAtprotoBlobUpload: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cid: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoHandleResolve: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    properties: {
                        handle: {
                            type: string;
                            description: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            did: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoRepoBatchWrite: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            did: {
                                type: string;
                                description: string;
                            };
                            validate: {
                                type: string;
                                default: boolean;
                                description: string;
                            };
                            writes: {
                                type: string;
                                items: {
                                    type: string;
                                    refs: string[];
                                    closed: boolean;
                                };
                            };
                        };
                    };
                };
            };
            create: {
                type: string;
                required: string[];
                properties: {
                    action: {
                        type: string;
                        const: string;
                    };
                    collection: {
                        type: string;
                    };
                    rkey: {
                        type: string;
                    };
                    value: {
                        type: string;
                    };
                };
            };
            update: {
                type: string;
                required: string[];
                properties: {
                    action: {
                        type: string;
                        const: string;
                    };
                    collection: {
                        type: string;
                    };
                    rkey: {
                        type: string;
                    };
                    value: {
                        type: string;
                    };
                };
            };
            delete: {
                type: string;
                required: string[];
                properties: {
                    action: {
                        type: string;
                        const: string;
                    };
                    collection: {
                        type: string;
                    };
                    rkey: {
                        type: string;
                    };
                };
            };
        };
    };
    ComAtprotoRepoCreateRecord: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            did: {
                                type: string;
                                description: string;
                            };
                            collection: {
                                type: string;
                                description: string;
                            };
                            validate: {
                                type: string;
                                default: boolean;
                                description: string;
                            };
                            record: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            uri: {
                                type: string;
                            };
                            cid: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoRepoDeleteRecord: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            did: {
                                type: string;
                                description: string;
                            };
                            collection: {
                                type: string;
                                description: string;
                            };
                            rkey: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoRepoDescribe: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        user: {
                            type: string;
                            description: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            handle: {
                                type: string;
                            };
                            did: {
                                type: string;
                            };
                            didDoc: {
                                type: string;
                            };
                            collections: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                            handleIsCorrect: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoRepoGetRecord: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        user: {
                            type: string;
                            description: string;
                        };
                        collection: {
                            type: string;
                            description: string;
                        };
                        rkey: {
                            type: string;
                            description: string;
                        };
                        cid: {
                            type: string;
                            description: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            uri: {
                                type: string;
                            };
                            cid: {
                                type: string;
                            };
                            value: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoRepoListRecords: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        user: {
                            type: string;
                            description: string;
                        };
                        collection: {
                            type: string;
                            description: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                            description: string;
                        };
                        before: {
                            type: string;
                            description: string;
                        };
                        after: {
                            type: string;
                            description: string;
                        };
                        reverse: {
                            type: string;
                            description: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            records: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            record: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    cid: {
                        type: string;
                    };
                    value: {
                        type: string;
                    };
                };
            };
        };
    };
    ComAtprotoRepoPutRecord: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            did: {
                                type: string;
                                description: string;
                            };
                            collection: {
                                type: string;
                                description: string;
                            };
                            rkey: {
                                type: string;
                                description: string;
                            };
                            validate: {
                                type: string;
                                default: boolean;
                                description: string;
                            };
                            record: {
                                type: string;
                                description: string;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            uri: {
                                type: string;
                            };
                            cid: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoRepoStrongRef: {
        lexicon: number;
        id: string;
        description: string;
        defs: {
            main: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    cid: {
                        type: string;
                    };
                };
            };
        };
    };
    ComAtprotoServerGetAccountsConfig: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            inviteCodeRequired: {
                                type: string;
                            };
                            availableUserDomains: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                            links: {
                                type: string;
                                ref: string;
                            };
                        };
                    };
                };
            };
            links: {
                type: string;
                properties: {
                    privacyPolicy: {
                        type: string;
                    };
                    termsOfService: {
                        type: string;
                    };
                };
            };
        };
    };
    ComAtprotoSessionCreate: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            handle: {
                                type: string;
                            };
                            password: {
                                type: string;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            accessJwt: {
                                type: string;
                            };
                            refreshJwt: {
                                type: string;
                            };
                            handle: {
                                type: string;
                            };
                            did: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoSessionDelete: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    ComAtprotoSessionGet: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            handle: {
                                type: string;
                            };
                            did: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoSessionRefresh: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            accessJwt: {
                                type: string;
                            };
                            refreshJwt: {
                                type: string;
                            };
                            handle: {
                                type: string;
                            };
                            did: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoSyncGetRepo: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        did: {
                            type: string;
                            description: string;
                        };
                        from: {
                            type: string;
                            description: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                };
            };
        };
    };
    ComAtprotoSyncGetRoot: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        did: {
                            type: string;
                            description: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            root: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    ComAtprotoSyncUpdateRepo: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        did: {
                            type: string;
                            description: string;
                        };
                    };
                };
                input: {
                    encoding: string;
                };
            };
        };
    };
    AppBskyActorCreateScene: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            handle: {
                                type: string;
                            };
                            recoveryKey: {
                                type: string;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            handle: {
                                type: string;
                            };
                            did: {
                                type: string;
                            };
                            declaration: {
                                type: string;
                                ref: string;
                            };
                        };
                    };
                };
                errors: {
                    name: string;
                }[];
            };
        };
    };
    AppBskyActorGetProfile: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        actor: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            did: {
                                type: string;
                            };
                            declaration: {
                                type: string;
                                ref: string;
                            };
                            handle: {
                                type: string;
                            };
                            creator: {
                                type: string;
                            };
                            displayName: {
                                type: string;
                                maxLength: number;
                            };
                            description: {
                                type: string;
                                maxLength: number;
                            };
                            avatar: {
                                type: string;
                            };
                            banner: {
                                type: string;
                            };
                            followersCount: {
                                type: string;
                            };
                            followsCount: {
                                type: string;
                            };
                            membersCount: {
                                type: string;
                            };
                            postsCount: {
                                type: string;
                            };
                            myState: {
                                type: string;
                                ref: string;
                            };
                        };
                    };
                };
            };
            myState: {
                type: string;
                properties: {
                    follow: {
                        type: string;
                    };
                    member: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyActorGetSuggestions: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    properties: {
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        cursor: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            actors: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            actor: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    description: {
                        type: string;
                    };
                    avatar: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                    myState: {
                        type: string;
                        ref: string;
                    };
                };
            };
            myState: {
                type: string;
                properties: {
                    follow: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyActorProfile: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        displayName: {
                            type: string;
                            maxLength: number;
                        };
                        description: {
                            type: string;
                            maxLength: number;
                        };
                        avatar: {
                            type: string;
                            accept: string[];
                            maxWidth: number;
                            maxHeight: number;
                            maxSize: number;
                        };
                        banner: {
                            type: string;
                            accept: string[];
                            maxWidth: number;
                            maxHeight: number;
                            maxSize: number;
                        };
                    };
                };
            };
        };
    };
    AppBskyActorRef: {
        lexicon: number;
        id: string;
        description: string;
        defs: {
            main: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declarationCid: {
                        type: string;
                    };
                };
            };
            withInfo: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    avatar: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyActorSearch: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        term: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            users: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            user: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    avatar: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyActorSearchTypeahead: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        term: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            users: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            user: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    avatar: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyActorUpdateProfile: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        properties: {
                            did: {
                                type: string;
                            };
                            displayName: {
                                type: string;
                                maxLength: number;
                            };
                            description: {
                                type: string;
                                maxLength: number;
                            };
                            avatar: {
                                type: string;
                                accept: string[];
                                maxWidth: number;
                                maxHeight: number;
                                maxSize: number;
                            };
                            banner: {
                                type: string;
                                accept: string[];
                                maxWidth: number;
                                maxHeight: number;
                                maxSize: number;
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            uri: {
                                type: string;
                            };
                            cid: {
                                type: string;
                            };
                            record: {
                                type: string;
                            };
                        };
                    };
                };
                errors: {
                    name: string;
                }[];
            };
        };
    };
    AppBskyEmbedExternal: {
        lexicon: number;
        id: string;
        description: string;
        defs: {
            main: {
                type: string;
                required: string[];
                properties: {
                    external: {
                        type: string;
                        ref: string;
                    };
                };
            };
            external: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    title: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    thumb: {
                        type: string;
                        accept: string[];
                        maxWidth: number;
                        maxHeight: number;
                        maxSize: number;
                    };
                };
            };
            presented: {
                type: string;
                required: string[];
                properties: {
                    external: {
                        type: string;
                        ref: string;
                    };
                };
            };
            presentedExternal: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    title: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    thumb: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyEmbedImages: {
        lexicon: number;
        id: string;
        description: string;
        defs: {
            main: {
                type: string;
                required: string[];
                properties: {
                    images: {
                        type: string;
                        items: {
                            type: string;
                            ref: string;
                        };
                        maxLength: number;
                    };
                };
            };
            image: {
                type: string;
                required: string[];
                properties: {
                    image: {
                        type: string;
                        accept: string[];
                        maxWidth: number;
                        maxHeight: number;
                        maxSize: number;
                    };
                    alt: {
                        type: string;
                    };
                };
            };
            presented: {
                type: string;
                required: string[];
                properties: {
                    images: {
                        type: string;
                        items: {
                            type: string;
                            ref: string;
                        };
                        maxLength: number;
                    };
                };
            };
            presentedImage: {
                type: string;
                required: string[];
                properties: {
                    thumb: {
                        type: string;
                    };
                    fullsize: {
                        type: string;
                    };
                    alt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyFeedFeedViewPost: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                required: string[];
                properties: {
                    post: {
                        type: string;
                        ref: string;
                    };
                    reply: {
                        type: string;
                        ref: string;
                    };
                    reason: {
                        type: string;
                        refs: string[];
                    };
                };
            };
            replyRef: {
                type: string;
                required: string[];
                properties: {
                    root: {
                        type: string;
                        ref: string;
                    };
                    parent: {
                        type: string;
                        ref: string;
                    };
                };
            };
            reasonTrend: {
                type: string;
                required: string[];
                properties: {
                    by: {
                        type: string;
                        ref: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
            reasonRepost: {
                type: string;
                required: string[];
                properties: {
                    by: {
                        type: string;
                        ref: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyFeedGetAuthorFeed: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        author: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            feed: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    AppBskyFeedGetPostThread: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        uri: {
                            type: string;
                        };
                        depth: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            thread: {
                                type: string;
                                refs: string[];
                            };
                        };
                    };
                };
                errors: {
                    name: string;
                }[];
            };
            threadViewPost: {
                type: string;
                required: string[];
                properties: {
                    post: {
                        type: string;
                        ref: string;
                    };
                    parent: {
                        type: string;
                        refs: string[];
                    };
                    replies: {
                        type: string;
                        items: {
                            type: string;
                            refs: string[];
                        };
                    };
                };
            };
            notFoundPost: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    notFound: {
                        type: string;
                        const: boolean;
                    };
                };
            };
        };
    };
    AppBskyFeedGetRepostedBy: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        uri: {
                            type: string;
                        };
                        cid: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            uri: {
                                type: string;
                            };
                            cid: {
                                type: string;
                            };
                            cursor: {
                                type: string;
                            };
                            repostedBy: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            repostedBy: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    avatar: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyFeedGetTimeline: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    properties: {
                        algorithm: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            feed: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    AppBskyFeedGetVotes: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        uri: {
                            type: string;
                        };
                        cid: {
                            type: string;
                        };
                        direction: {
                            type: string;
                            enum: string[];
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            uri: {
                                type: string;
                            };
                            cid: {
                                type: string;
                            };
                            cursor: {
                                type: string;
                            };
                            votes: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            vote: {
                type: string;
                required: string[];
                properties: {
                    direction: {
                        type: string;
                        enum: string[];
                    };
                    indexedAt: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                    };
                    actor: {
                        type: string;
                        ref: string;
                    };
                };
            };
        };
    };
    AppBskyFeedPost: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        text: {
                            type: string;
                            maxLength: number;
                        };
                        entities: {
                            type: string;
                            items: {
                                type: string;
                                ref: string;
                            };
                        };
                        reply: {
                            type: string;
                            ref: string;
                        };
                        embed: {
                            type: string;
                            refs: string[];
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
            replyRef: {
                type: string;
                required: string[];
                properties: {
                    root: {
                        type: string;
                        ref: string;
                    };
                    parent: {
                        type: string;
                        ref: string;
                    };
                };
            };
            entity: {
                type: string;
                required: string[];
                properties: {
                    index: {
                        type: string;
                        ref: string;
                    };
                    type: {
                        type: string;
                        description: string;
                    };
                    value: {
                        type: string;
                    };
                };
            };
            textSlice: {
                type: string;
                required: string[];
                properties: {
                    start: {
                        type: string;
                        minimum: number;
                    };
                    end: {
                        type: string;
                        minimum: number;
                    };
                };
            };
            view: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    cid: {
                        type: string;
                    };
                    author: {
                        type: string;
                        ref: string;
                    };
                    record: {
                        type: string;
                    };
                    embed: {
                        type: string;
                        refs: string[];
                    };
                    replyCount: {
                        type: string;
                    };
                    repostCount: {
                        type: string;
                    };
                    upvoteCount: {
                        type: string;
                    };
                    downvoteCount: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                    viewer: {
                        type: string;
                        ref: string;
                    };
                };
            };
            viewerState: {
                type: string;
                properties: {
                    repost: {
                        type: string;
                    };
                    upvote: {
                        type: string;
                    };
                    downvote: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyFeedRepost: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        subject: {
                            type: string;
                            ref: string;
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    AppBskyFeedSetVote: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            subject: {
                                type: string;
                                ref: string;
                            };
                            direction: {
                                type: string;
                                enum: string[];
                            };
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        properties: {
                            upvote: {
                                type: string;
                            };
                            downvote: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    AppBskyFeedTrend: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        subject: {
                            type: string;
                            ref: string;
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    AppBskyFeedVote: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        subject: {
                            type: string;
                            ref: string;
                        };
                        direction: {
                            type: string;
                            enum: string[];
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    AppBskyGraphAssertCreator: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    AppBskyGraphAssertMember: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    AppBskyGraphAssertion: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        assertion: {
                            type: string;
                        };
                        subject: {
                            type: string;
                            ref: string;
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    AppBskyGraphConfirmation: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        originator: {
                            type: string;
                            ref: string;
                        };
                        assertion: {
                            type: string;
                            ref: string;
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    AppBskyGraphFollow: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        subject: {
                            type: string;
                            ref: string;
                        };
                        createdAt: {
                            type: string;
                        };
                    };
                };
            };
        };
    };
    AppBskyGraphGetAssertions: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    properties: {
                        author: {
                            type: string;
                        };
                        subject: {
                            type: string;
                        };
                        assertion: {
                            type: string;
                        };
                        confirmed: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            assertions: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            assertion: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    cid: {
                        type: string;
                    };
                    assertion: {
                        type: string;
                    };
                    confirmation: {
                        type: string;
                        ref: string;
                    };
                    author: {
                        type: string;
                        ref: string;
                    };
                    subject: {
                        type: string;
                        ref: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                    };
                };
            };
            confirmation: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    cid: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyGraphGetFollowers: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        user: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            subject: {
                                type: string;
                                ref: string;
                            };
                            cursor: {
                                type: string;
                            };
                            followers: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            follower: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    avatar: {
                        type: string;
                    };
                    createdAt: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyGraphGetFollows: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        user: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            subject: {
                                type: string;
                                ref: string;
                            };
                            cursor: {
                                type: string;
                            };
                            follows: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            follow: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    createdAt: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyGraphGetMembers: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        actor: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            subject: {
                                type: string;
                                ref: string;
                            };
                            cursor: {
                                type: string;
                            };
                            members: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            member: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    createdAt: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyGraphGetMemberships: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                parameters: {
                    type: string;
                    required: string[];
                    properties: {
                        actor: {
                            type: string;
                        };
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            subject: {
                                type: string;
                                ref: string;
                            };
                            cursor: {
                                type: string;
                            };
                            memberships: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            membership: {
                type: string;
                required: string[];
                properties: {
                    did: {
                        type: string;
                    };
                    declaration: {
                        type: string;
                        ref: string;
                    };
                    handle: {
                        type: string;
                    };
                    displayName: {
                        type: string;
                        maxLength: number;
                    };
                    createdAt: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyNotificationGetCount: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            count: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    AppBskyNotificationList: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                parameters: {
                    type: string;
                    properties: {
                        limit: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                        };
                        before: {
                            type: string;
                        };
                    };
                };
                output: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            cursor: {
                                type: string;
                            };
                            notifications: {
                                type: string;
                                items: {
                                    type: string;
                                    ref: string;
                                };
                            };
                        };
                    };
                };
            };
            notification: {
                type: string;
                required: string[];
                properties: {
                    uri: {
                        type: string;
                    };
                    cid: {
                        type: string;
                    };
                    author: {
                        type: string;
                        ref: string;
                    };
                    reason: {
                        type: string;
                        description: string;
                        knownValues: string[];
                    };
                    reasonSubject: {
                        type: string;
                    };
                    record: {
                        type: string;
                    };
                    isRead: {
                        type: string;
                    };
                    indexedAt: {
                        type: string;
                    };
                };
            };
        };
    };
    AppBskyNotificationUpdateSeen: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
                input: {
                    encoding: string;
                    schema: {
                        type: string;
                        required: string[];
                        properties: {
                            seenAt: {
                                type: string;
                            };
                        };
                    };
                };
            };
        };
    };
    AppBskySystemActorScene: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    AppBskySystemActorUser: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                type: string;
                description: string;
            };
        };
    };
    AppBskySystemDeclRef: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                description: string;
                type: string;
                required: string[];
                properties: {
                    cid: {
                        type: string;
                    };
                    actorType: {
                        type: string;
                        knownValues: string[];
                    };
                };
            };
        };
    };
    AppBskySystemDeclaration: {
        lexicon: number;
        id: string;
        defs: {
            main: {
                description: string;
                type: string;
                key: string;
                record: {
                    type: string;
                    required: string[];
                    properties: {
                        actorType: {
                            type: string;
                            knownValues: string[];
                        };
                    };
                };
            };
        };
    };
};
export declare const schemas: LexiconDoc[];
export declare const lexicons: Lexicons;
export declare const ids: {
    ComAtprotoAccountCreate: string;
    ComAtprotoAccountCreateInviteCode: string;
    ComAtprotoAccountDelete: string;
    ComAtprotoAccountGet: string;
    ComAtprotoAccountRequestPasswordReset: string;
    ComAtprotoAccountResetPassword: string;
    ComAtprotoBlobUpload: string;
    ComAtprotoHandleResolve: string;
    ComAtprotoRepoBatchWrite: string;
    ComAtprotoRepoCreateRecord: string;
    ComAtprotoRepoDeleteRecord: string;
    ComAtprotoRepoDescribe: string;
    ComAtprotoRepoGetRecord: string;
    ComAtprotoRepoListRecords: string;
    ComAtprotoRepoPutRecord: string;
    ComAtprotoRepoStrongRef: string;
    ComAtprotoServerGetAccountsConfig: string;
    ComAtprotoSessionCreate: string;
    ComAtprotoSessionDelete: string;
    ComAtprotoSessionGet: string;
    ComAtprotoSessionRefresh: string;
    ComAtprotoSyncGetRepo: string;
    ComAtprotoSyncGetRoot: string;
    ComAtprotoSyncUpdateRepo: string;
    AppBskyActorCreateScene: string;
    AppBskyActorGetProfile: string;
    AppBskyActorGetSuggestions: string;
    AppBskyActorProfile: string;
    AppBskyActorRef: string;
    AppBskyActorSearch: string;
    AppBskyActorSearchTypeahead: string;
    AppBskyActorUpdateProfile: string;
    AppBskyEmbedExternal: string;
    AppBskyEmbedImages: string;
    AppBskyFeedFeedViewPost: string;
    AppBskyFeedGetAuthorFeed: string;
    AppBskyFeedGetPostThread: string;
    AppBskyFeedGetRepostedBy: string;
    AppBskyFeedGetTimeline: string;
    AppBskyFeedGetVotes: string;
    AppBskyFeedPost: string;
    AppBskyFeedRepost: string;
    AppBskyFeedSetVote: string;
    AppBskyFeedTrend: string;
    AppBskyFeedVote: string;
    AppBskyGraphAssertCreator: string;
    AppBskyGraphAssertMember: string;
    AppBskyGraphAssertion: string;
    AppBskyGraphConfirmation: string;
    AppBskyGraphFollow: string;
    AppBskyGraphGetAssertions: string;
    AppBskyGraphGetFollowers: string;
    AppBskyGraphGetFollows: string;
    AppBskyGraphGetMembers: string;
    AppBskyGraphGetMemberships: string;
    AppBskyNotificationGetCount: string;
    AppBskyNotificationList: string;
    AppBskyNotificationUpdateSeen: string;
    AppBskySystemActorScene: string;
    AppBskySystemActorUser: string;
    AppBskySystemDeclRef: string;
    AppBskySystemDeclaration: string;
};
