import { MMKV } from '@bsky.app/react-native-mmkv';
export function create(_a) {
    var id = _a.id;
    var store = new MMKV({ id: id });
    return {
        get: function (key) {
            return store.getString(key);
        },
        set: function (key, value) {
            return store.set(key, value);
        },
        delete: function (key) {
            return store.delete(key);
        },
        clear: function () {
            return store.clearAll();
        },
    };
}
