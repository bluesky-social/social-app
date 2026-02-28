import { beforeEach, expect, jest, test } from '@jest/globals';
import { Storage } from '#/storage';
jest.mock('@bsky.app/react-native-mmkv', function () { return ({
    MMKV: /** @class */ (function () {
        function MMKVMock() {
            this._store = new Map();
        }
        MMKVMock.prototype.set = function (key, value) {
            this._store.set(key, value);
        };
        MMKVMock.prototype.getString = function (key) {
            return this._store.get(key);
        };
        MMKVMock.prototype.delete = function (key) {
            return this._store.delete(key);
        };
        return MMKVMock;
    }()),
}); });
var scope = "account";
var store = new Storage({ id: 'test' });
beforeEach(function () {
    store.removeMany([scope], ['boo', 'str', 'num', 'obj']);
});
test("stores and retrieves data", function () {
    store.set([scope, 'boo'], true);
    store.set([scope, 'str'], 'string');
    store.set([scope, 'num'], 1);
    expect(store.get([scope, 'boo'])).toEqual(true);
    expect(store.get([scope, 'str'])).toEqual('string');
    expect(store.get([scope, 'num'])).toEqual(1);
});
test("removes data", function () {
    store.set([scope, 'boo'], true);
    expect(store.get([scope, 'boo'])).toEqual(true);
    store.remove([scope, 'boo']);
    expect(store.get([scope, 'boo'])).toEqual(undefined);
});
test("removes multiple keys at once", function () {
    store.set([scope, 'boo'], true);
    store.set([scope, 'str'], 'string');
    store.set([scope, 'num'], 1);
    store.removeMany([scope], ['boo', 'str', 'num']);
    expect(store.get([scope, 'boo'])).toEqual(undefined);
    expect(store.get([scope, 'str'])).toEqual(undefined);
    expect(store.get([scope, 'num'])).toEqual(undefined);
});
test("concatenates keys", function () {
    store.remove([scope, 'str']);
    store.set([scope, 'str'], 'concat');
    // @ts-ignore accessing these properties for testing purposes only
    expect(store.store.getString("".concat(scope).concat(store.sep, "str"))).toBeTruthy();
});
test("can store falsy values", function () {
    store.set([scope, 'str'], null);
    store.set([scope, 'num'], 0);
    expect(store.get([scope, 'str'])).toEqual(null);
    expect(store.get([scope, 'num'])).toEqual(0);
});
test("can store objects", function () {
    var obj = { foo: true };
    store.set([scope, 'obj'], obj);
    expect(store.get([scope, 'obj'])).toEqual(obj);
});
