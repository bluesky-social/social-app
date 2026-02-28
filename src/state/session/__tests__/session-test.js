import { BskyAgent } from '@atproto/api';
import { describe, expect, it, jest } from '@jest/globals';
import { agentToSessionAccountOrThrow } from '../agent';
import { getInitialState, reducer } from '../reducer';
jest.mock('jwt-decode', function () { return ({
    jwtDecode: function (_token) {
        return {};
    },
}); });
jest.mock('../../birthdate');
jest.mock('../../../ageAssurance/data');
jest.mock('#/lib/notifications/notifications', function () { return ({
    unregisterPushToken: function (_agents) {
        return Promise.resolve();
    },
}); });
describe('session', function () {
    it('can log in and out', function () {
        var state = getInitialState([]);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": false,\n      }\n    ");
        var agent = new BskyAgent({ service: 'https://alice.com' });
        agent.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent,
                newAccount: agentToSessionAccountOrThrow(agent),
            },
        ]);
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].did).toBe('alice-did');
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-1\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        state = run(state, [
            {
                type: 'logged-out-every-account',
            },
        ]);
        // Should keep the account but clear out the tokens.
        expect(state.currentAgentState.did).toBe(undefined);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].did).toBe('alice-did');
        expect(state.accounts[0].accessJwt).toBe(undefined);
        expect(state.accounts[0].refreshJwt).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('switches to the latest account, stores all of them', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                // Switch to Alice.
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].did).toBe('alice-did');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(state.currentAgentState.agent).toBe(agent1);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-1\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        var agent2 = new BskyAgent({ service: 'https://bob.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-1',
            refreshJwt: 'bob-refresh-jwt-1',
        };
        state = run(state, [
            {
                // Switch to Bob.
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
        ]);
        expect(state.accounts.length).toBe(2);
        // Bob should float upwards.
        expect(state.accounts[0].did).toBe('bob-did');
        expect(state.accounts[1].did).toBe('alice-did');
        expect(state.currentAgentState.did).toBe('bob-did');
        expect(state.currentAgentState.agent).toBe(agent2);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"bob-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-1\",\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"alice-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-1\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://bob.com/\",\n          },\n          \"did\": \"bob-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        var agent3 = new BskyAgent({ service: 'https://alice.com' });
        agent3.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-2',
            refreshJwt: 'alice-refresh-jwt-2',
        };
        state = run(state, [
            {
                // Switch back to Alice.
                type: 'switched-to-account',
                newAgent: agent3,
                newAccount: agentToSessionAccountOrThrow(agent3),
            },
        ]);
        expect(state.accounts.length).toBe(2);
        // Alice should float upwards.
        expect(state.accounts[0].did).toBe('alice-did');
        expect(state.accounts[0].handle).toBe('alice-updated.test');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(state.currentAgentState.agent).toBe(agent3);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"bob-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-1\",\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        var agent4 = new BskyAgent({ service: 'https://jay.com' });
        agent4.sessionManager.session = {
            active: true,
            did: 'jay-did',
            handle: 'jay.test',
            accessJwt: 'jay-access-jwt-1',
            refreshJwt: 'jay-refresh-jwt-1',
        };
        state = run(state, [
            {
                // Switch to Jay.
                type: 'switched-to-account',
                newAgent: agent4,
                newAccount: agentToSessionAccountOrThrow(agent4),
            },
        ]);
        expect(state.accounts.length).toBe(3);
        expect(state.accounts[0].did).toBe('jay-did');
        expect(state.currentAgentState.did).toBe('jay-did');
        expect(state.currentAgentState.agent).toBe(agent4);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"jay-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"jay-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"jay.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"jay-refresh-jwt-1\",\n            \"service\": \"https://jay.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"alice-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"bob-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-1\",\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://jay.com/\",\n          },\n          \"did\": \"jay-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        state = run(state, [
            {
                // Log everyone out.
                type: 'logged-out-every-account',
            },
        ]);
        expect(state.accounts.length).toBe(3);
        expect(state.currentAgentState.did).toBe(undefined);
        // All tokens should be gone.
        expect(state.accounts[0].accessJwt).toBe(undefined);
        expect(state.accounts[0].refreshJwt).toBe(undefined);
        expect(state.accounts[1].accessJwt).toBe(undefined);
        expect(state.accounts[1].refreshJwt).toBe(undefined);
        expect(state.accounts[2].accessJwt).toBe(undefined);
        expect(state.accounts[2].refreshJwt).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"jay-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"jay.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://jay.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('can log back in after logging out', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1');
        expect(state.currentAgentState.did).toBe('alice-did');
        state = run(state, [
            {
                type: 'logged-out-every-account',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe(undefined);
        expect(state.accounts[0].refreshJwt).toBe(undefined);
        expect(state.currentAgentState.did).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
        var agent2 = new BskyAgent({ service: 'https://alice.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-2',
            refreshJwt: 'alice-refresh-jwt-2',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('can remove active account', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1');
        expect(state.currentAgentState.did).toBe('alice-did');
        state = run(state, [
            {
                type: 'removed-account',
                accountDid: 'alice-did',
            },
        ]);
        expect(state.accounts.length).toBe(0);
        expect(state.currentAgentState.did).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('can remove inactive account', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        var agent2 = new BskyAgent({ service: 'https://bob.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-1',
            refreshJwt: 'bob-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
            {
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.currentAgentState.did).toBe('bob-did');
        state = run(state, [
            {
                type: 'removed-account',
                accountDid: 'alice-did',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.currentAgentState.did).toBe('bob-did');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"bob-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-1\",\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://bob.com/\",\n          },\n          \"did\": \"bob-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        state = run(state, [
            {
                type: 'removed-account',
                accountDid: 'bob-did',
            },
        ]);
        expect(state.accounts.length).toBe(0);
        expect(state.currentAgentState.did).toBe(undefined);
    });
    it('can log out of the current account', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1');
        expect(state.currentAgentState.did).toBe('alice-did');
        var agent2 = new BskyAgent({ service: 'https://bob.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-1',
            refreshJwt: 'bob-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-1');
        expect(state.accounts[0].refreshJwt).toBe('bob-refresh-jwt-1');
        expect(state.currentAgentState.did).toBe('bob-did');
        state = run(state, [
            {
                type: 'logged-out-current-account',
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.accounts[0].accessJwt).toBe(undefined);
        expect(state.accounts[0].refreshJwt).toBe(undefined);
        expect(state.accounts[1].accessJwt).toBe('alice-access-jwt-1');
        expect(state.accounts[1].refreshJwt).toBe('alice-refresh-jwt-1');
        expect(state.currentAgentState.did).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"alice-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-1\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('updates stored account with refreshed tokens', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.currentAgentState.did).toBe('alice-did');
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-2',
            refreshJwt: 'alice-refresh-jwt-2',
            email: 'alice@foo.bar',
            emailAuthFactor: false,
            emailConfirmed: false,
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].email).toBe('alice@foo.bar');
        expect(state.accounts[0].handle).toBe('alice-updated.test');
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": \"alice@foo.bar\",\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-3',
            refreshJwt: 'alice-refresh-jwt-3',
            email: 'alice@foo.baz',
            emailAuthFactor: true,
            emailConfirmed: true,
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].email).toBe('alice@foo.baz');
        expect(state.accounts[0].handle).toBe('alice-updated.test');
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-3');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-3');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-3\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": \"alice@foo.baz\",\n            \"emailAuthFactor\": true,\n            \"emailConfirmed\": true,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-3\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-4',
            refreshJwt: 'alice-refresh-jwt-4',
            email: 'alice@foo.baz',
            emailAuthFactor: false,
            emailConfirmed: false,
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].email).toBe('alice@foo.baz');
        expect(state.accounts[0].handle).toBe('alice-updated.test');
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-4');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-4');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-4\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": \"alice@foo.baz\",\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-4\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('bails out of update on identical objects', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.currentAgentState.did).toBe('alice-did');
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-2',
            refreshJwt: 'alice-refresh-jwt-2',
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2');
        var lastState = state;
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(lastState === state).toBe(true);
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-3',
            refreshJwt: 'alice-refresh-jwt-3',
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-3');
    });
    it('accepts updates from a stale agent', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        var agent2 = new BskyAgent({ service: 'https://bob.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-1',
            refreshJwt: 'bob-refresh-jwt-1',
        };
        state = run(state, [
            {
                // Switch to Alice.
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
            {
                // Switch to Bob.
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.currentAgentState.did).toBe('bob-did');
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice-updated.test',
            accessJwt: 'alice-access-jwt-2',
            refreshJwt: 'alice-refresh-jwt-2',
            email: 'alice@foo.bar',
            emailAuthFactor: false,
            emailConfirmed: false,
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.accounts[1].did).toBe('alice-did');
        // Should update Alice's tokens because otherwise they'll be stale.
        expect(state.accounts[1].handle).toBe('alice-updated.test');
        expect(state.accounts[1].accessJwt).toBe('alice-access-jwt-2');
        expect(state.accounts[1].refreshJwt).toBe('alice-refresh-jwt-2');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"bob-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-1\",\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"alice-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": \"alice@foo.bar\",\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://bob.com/\",\n          },\n          \"did\": \"bob-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob-updated.test',
            accessJwt: 'bob-access-jwt-2',
            refreshJwt: 'bob-refresh-jwt-2',
        };
        state = run(state, [
            {
                // Update Bob.
                type: 'received-agent-event',
                accountDid: 'bob-did',
                agent: agent2,
                refreshedAccount: agentToSessionAccountOrThrow(agent2),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.accounts[0].did).toBe('bob-did');
        // Should update Bob's tokens because otherwise they'll be stale.
        expect(state.accounts[0].handle).toBe('bob-updated.test');
        expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-2');
        expect(state.accounts[0].refreshJwt).toBe('bob-refresh-jwt-2');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"bob-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-2\",\n            \"service\": \"https://bob.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"alice-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": \"alice@foo.bar\",\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice-updated.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://bob.com/\",\n          },\n          \"did\": \"bob-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
        // Ignore other events for inactive agent.
        var lastState = state;
        agent1.sessionManager.session = undefined;
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: undefined,
                sessionEvent: 'network-error',
            },
        ]);
        expect(lastState === state).toBe(true);
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: undefined,
                sessionEvent: 'expired',
            },
        ]);
        expect(lastState === state).toBe(true);
    });
    it('ignores updates from a removed agent', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        var agent2 = new BskyAgent({ service: 'https://bob.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-1',
            refreshJwt: 'bob-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
            {
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
            {
                type: 'removed-account',
                accountDid: 'alice-did',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.currentAgentState.did).toBe('bob-did');
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-2',
            refreshJwt: 'alice-refresh-jwt-2',
        };
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: agentToSessionAccountOrThrow(agent1),
                sessionEvent: 'update',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].did).toBe('bob-did');
        expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-1');
        expect(state.currentAgentState.did).toBe('bob-did');
    });
    it('ignores network errors', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                // Switch to Alice.
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.currentAgentState.did).toBe('alice-did');
        agent1.sessionManager.session = undefined;
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: undefined,
                sessionEvent: 'network-error',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1');
        expect(state.currentAgentState.did).toBe('alice-did');
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"alice-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"alice-refresh-jwt-1\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://alice.com/\",\n          },\n          \"did\": \"alice-did\",\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('resets tokens on expired event', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.currentAgentState.did).toBe('alice-did');
        agent1.sessionManager.session = undefined;
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: undefined,
                sessionEvent: 'expired',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe(undefined);
        expect(state.accounts[0].refreshJwt).toBe(undefined);
        expect(state.currentAgentState.did).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('resets tokens on created-failed event', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1');
        expect(state.currentAgentState.did).toBe('alice-did');
        agent1.sessionManager.session = undefined;
        state = run(state, [
            {
                type: 'received-agent-event',
                accountDid: 'alice-did',
                agent: agent1,
                refreshedAccount: undefined,
                sessionEvent: 'create-failed',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].accessJwt).toBe(undefined);
        expect(state.accounts[0].refreshJwt).toBe(undefined);
        expect(state.currentAgentState.did).toBe(undefined);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": undefined,\n            \"active\": true,\n            \"did\": \"alice-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"alice.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": undefined,\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": true,\n      }\n    ");
    });
    it('replaces local accounts with synced accounts', function () {
        var state = getInitialState([]);
        var agent1 = new BskyAgent({ service: 'https://alice.com' });
        agent1.sessionManager.session = {
            active: true,
            did: 'alice-did',
            handle: 'alice.test',
            accessJwt: 'alice-access-jwt-1',
            refreshJwt: 'alice-refresh-jwt-1',
        };
        var agent2 = new BskyAgent({ service: 'https://bob.com' });
        agent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-1',
            refreshJwt: 'bob-refresh-jwt-1',
        };
        state = run(state, [
            {
                type: 'switched-to-account',
                newAgent: agent1,
                newAccount: agentToSessionAccountOrThrow(agent1),
            },
            {
                type: 'switched-to-account',
                newAgent: agent2,
                newAccount: agentToSessionAccountOrThrow(agent2),
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.currentAgentState.did).toBe('bob-did');
        var anotherTabAgent1 = new BskyAgent({ service: 'https://jay.com' });
        anotherTabAgent1.sessionManager.session = {
            active: true,
            did: 'jay-did',
            handle: 'jay.test',
            accessJwt: 'jay-access-jwt-1',
            refreshJwt: 'jay-refresh-jwt-1',
        };
        var anotherTabAgent2 = new BskyAgent({ service: 'https://alice.com' });
        anotherTabAgent2.sessionManager.session = {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-2',
            refreshJwt: 'bob-refresh-jwt-2',
        };
        state = run(state, [
            {
                type: 'synced-accounts',
                syncedAccounts: [
                    agentToSessionAccountOrThrow(anotherTabAgent1),
                    agentToSessionAccountOrThrow(anotherTabAgent2),
                ],
                syncedCurrentDid: 'bob-did',
            },
        ]);
        expect(state.accounts.length).toBe(2);
        expect(state.accounts[0].did).toBe('jay-did');
        expect(state.accounts[1].did).toBe('bob-did');
        expect(state.accounts[1].accessJwt).toBe('bob-access-jwt-2');
        // Keep Bob logged in.
        // (We patch up agent.session outside the reducer for this to work.)
        expect(state.currentAgentState.did).toBe('bob-did');
        expect(state.needsPersist).toBe(false);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"jay-access-jwt-1\",\n            \"active\": true,\n            \"did\": \"jay-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"jay.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"jay-refresh-jwt-1\",\n            \"service\": \"https://jay.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n          {\n            \"accessJwt\": \"bob-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"bob-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"bob.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"bob-refresh-jwt-2\",\n            \"service\": \"https://alice.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://bob.com/\",\n          },\n          \"did\": \"bob-did\",\n        },\n        \"needsPersist\": false,\n      }\n    ");
        var anotherTabAgent3 = new BskyAgent({ service: 'https://clarence.com' });
        anotherTabAgent3.sessionManager.session = {
            active: true,
            did: 'clarence-did',
            handle: 'clarence.test',
            accessJwt: 'clarence-access-jwt-2',
            refreshJwt: 'clarence-refresh-jwt-2',
        };
        state = run(state, [
            {
                type: 'synced-accounts',
                syncedAccounts: [agentToSessionAccountOrThrow(anotherTabAgent3)],
                syncedCurrentDid: 'clarence-did',
            },
        ]);
        expect(state.accounts.length).toBe(1);
        expect(state.accounts[0].did).toBe('clarence-did');
        // Log out because we have no matching user.
        // (In practice, we'll resume this session outside the reducer.)
        expect(state.currentAgentState.did).toBe(undefined);
        expect(state.needsPersist).toBe(false);
        expect(printState(state)).toMatchInlineSnapshot("\n      {\n        \"accounts\": [\n          {\n            \"accessJwt\": \"clarence-access-jwt-2\",\n            \"active\": true,\n            \"did\": \"clarence-did\",\n            \"email\": undefined,\n            \"emailAuthFactor\": false,\n            \"emailConfirmed\": false,\n            \"handle\": \"clarence.test\",\n            \"isSelfHosted\": true,\n            \"pdsUrl\": undefined,\n            \"refreshJwt\": \"clarence-refresh-jwt-2\",\n            \"service\": \"https://clarence.com/\",\n            \"signupQueued\": false,\n            \"status\": undefined,\n          },\n        ],\n        \"currentAgentState\": {\n          \"agent\": {\n            \"service\": \"https://public.api.bsky.app/\",\n          },\n          \"did\": undefined,\n        },\n        \"needsPersist\": false,\n      }\n    ");
    });
});
function run(initialState, actions) {
    var state = initialState;
    for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
        var action = actions_1[_i];
        state = reducer(state, action);
    }
    return state;
}
function printState(state) {
    return {
        accounts: state.accounts,
        currentAgentState: {
            agent: { service: state.currentAgentState.agent.service },
            did: state.currentAgentState.did,
        },
        needsPersist: state.needsPersist,
    };
}
