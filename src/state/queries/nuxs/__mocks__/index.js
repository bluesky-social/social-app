import { jest } from '@jest/globals';
export { Nux } from '#/state/queries/nuxs/definitions';
export var useNuxs = jest.fn(function () {
    return {
        nuxs: undefined,
        status: 'loading',
    };
});
export var useNux = jest.fn(function (id) {
    return {
        nux: undefined,
        status: 'loading',
    };
});
export var useSaveNux = jest.fn(function () {
    return {};
});
export var useResetNuxs = jest.fn(function () {
    return {};
});
