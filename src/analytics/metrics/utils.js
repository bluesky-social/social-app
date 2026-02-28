export function toClout(n) {
    if (n == null) {
        return undefined;
    }
    else {
        return Math.max(0, Math.round(Math.log(n)));
    }
}
