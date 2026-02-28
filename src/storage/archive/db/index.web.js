import { clear, createStore, del, get, set } from 'idb-keyval';
export function create(_a) {
    var id = _a.id;
    var store = createStore(id, id);
    return {
        get: function (key) {
            return get(key, store);
        },
        set: function (key, value) {
            return set(key, value, store);
        },
        delete: function (key) {
            return del(key, store);
        },
        clear: function () {
            return clear(store);
        },
    };
}
