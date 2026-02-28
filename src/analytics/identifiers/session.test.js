jest.mock('#/storage', function () { return ({
    device: {
        get: jest.fn(),
        set: jest.fn(),
    },
}); });
jest.mock('#/analytics/identifiers/util', function () { return ({
    isSessionIdExpired: jest.fn(),
}); });
jest.mock('#/lib/appState', function () { return ({
    onAppStateChange: jest.fn(function () { return ({ remove: jest.fn() }); }),
}); });
beforeEach(function () {
    jest.resetModules();
    jest.clearAllMocks();
});
function getMocks() {
    var device = require('#/storage').device;
    var isSessionIdExpired = require('#/analytics/identifiers/util').isSessionIdExpired;
    return {
        device: jest.mocked(device),
        isSessionIdExpired: jest.mocked(isSessionIdExpired),
    };
}
describe('session initialization', function () {
    it('creates new session and sets timestamp when none exists', function () {
        var _a = getMocks(), device = _a.device, isSessionIdExpired = _a.isSessionIdExpired;
        device.get.mockReturnValue(undefined);
        isSessionIdExpired.mockReturnValue(false);
        var getInitialSessionId = require('./session').getInitialSessionId;
        var id = getInitialSessionId();
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(device.set).toHaveBeenCalledWith(['nativeSessionId'], id);
        expect(device.set).toHaveBeenCalledWith(['nativeSessionIdLastEventAt'], expect.any(Number));
    });
    it('reuses existing session when not expired', function () {
        var _a = getMocks(), device = _a.device, isSessionIdExpired = _a.isSessionIdExpired;
        var existingId = 'existing-session-id';
        device.get.mockImplementation(function (key) {
            if (key[0] === 'nativeSessionId')
                return existingId;
            if (key[0] === 'nativeSessionIdLastEventAt')
                return Date.now();
            return undefined;
        });
        isSessionIdExpired.mockReturnValue(false);
        var getInitialSessionId = require('./session').getInitialSessionId;
        expect(getInitialSessionId()).toBe(existingId);
    });
    it('creates new session when existing is expired', function () {
        var _a = getMocks(), device = _a.device, isSessionIdExpired = _a.isSessionIdExpired;
        var existingId = 'existing-session-id';
        device.get.mockImplementation(function (key) {
            if (key[0] === 'nativeSessionId')
                return existingId;
            if (key[0] === 'nativeSessionIdLastEventAt')
                return Date.now() - 999999;
            return undefined;
        });
        isSessionIdExpired.mockReturnValue(true);
        var getInitialSessionId = require('./session').getInitialSessionId;
        var id = getInitialSessionId();
        expect(id).not.toBe(existingId);
        expect(device.set).toHaveBeenCalledWith(['nativeSessionId'], id);
    });
});
