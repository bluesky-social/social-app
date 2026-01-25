var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useCallback, useEffect, useState } from 'react';
import { MMKV } from '@bsky.app/react-native-mmkv';
export * from '#/storage/schema';
/**
 * Generic storage class. DO NOT use this directly. Instead, use the exported
 * storage instances below.
 */
var Storage = /** @class */ (function () {
    function Storage(_a) {
        var id = _a.id;
        this.sep = ':';
        this.store = new MMKV({ id: id });
    }
    /**
     * Store a value in storage based on scopes and/or keys
     *
     *   `set([key], value)`
     *   `set([scope, key], value)`
     */
    Storage.prototype.set = function (scopes, data) {
        // stored as `{ data: <value> }` structure to ease stringification
        this.store.set(scopes.join(this.sep), JSON.stringify({ data: data }));
    };
    /**
     * Get a value from storage based on scopes and/or keys
     *
     *   `get([key])`
     *   `get([scope, key])`
     */
    Storage.prototype.get = function (scopes) {
        var res = this.store.getString(scopes.join(this.sep));
        if (!res)
            return undefined;
        // parsed from storage structure `{ data: <value> }`
        return JSON.parse(res).data;
    };
    /**
     * Remove a value from storage based on scopes and/or keys
     *
     *   `remove([key])`
     *   `remove([scope, key])`
     */
    Storage.prototype.remove = function (scopes) {
        this.store.delete(scopes.join(this.sep));
    };
    /**
     * Remove many values from the same storage scope by keys
     *
     *   `removeMany([], [key])`
     *   `removeMany([scope], [key])`
     */
    Storage.prototype.removeMany = function (scopes, keys) {
        var _this = this;
        keys.forEach(function (key) { return _this.remove(__spreadArray(__spreadArray([], scopes, true), [key], false)); });
    };
    /**
     * For debugging purposes
     */
    Storage.prototype.removeAll = function () {
        this.store.clearAll();
    };
    /**
     * Fires a callback when the storage associated with a given key changes
     *
     * @returns Listener - call `remove()` to stop listening
     */
    Storage.prototype.addOnValueChangedListener = function (scopes, callback) {
        var _this = this;
        return this.store.addOnValueChangedListener(function (key) {
            if (key === scopes.join(_this.sep)) {
                callback();
            }
        });
    };
    return Storage;
}());
export { Storage };
/**
 * Hook to use a storage instance. Acts like a useState hook, but persists the
 * value in storage.
 */
export function useStorage(storage, scopes) {
    var _a = useState(function () {
        return storage.get(scopes);
    }), value = _a[0], setValue = _a[1];
    useEffect(function () {
        var sub = storage.addOnValueChangedListener(scopes, function () {
            setValue(storage.get(scopes));
        });
        return function () { return sub.remove(); };
    }, [storage, scopes]);
    var setter = useCallback(function (data) {
        setValue(data);
        storage.set(scopes, data);
    }, [storage, scopes]);
    return [value, setter];
}
/**
 * Device data that's specific to the device and does not vary based on account
 *
 *   `device.set([key], true)`
 */
export var device = new Storage({ id: 'bsky_device' });
/**
 * Account data that's specific to the account on this device
 */
export var account = new Storage({ id: 'bsky_account' });
if (__DEV__ && typeof window !== 'undefined') {
    // @ts-expect-error - dev global
    window.bsky_storage = {
        device: device,
        account: account,
    };
}
