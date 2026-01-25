var entries = [];
export function add(entry) {
    entries.unshift(entry);
    entries = entries.slice(0, 500);
}
export function getEntries() {
    return entries;
}
