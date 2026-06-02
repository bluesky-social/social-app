// Holds the splitview left column's scroll offset across re-mounts caused
// by in-splitview navigation. Reset on full page reload, mirroring the
// in-memory semantics of useWebScrollRestoration.
export const splitViewLeftScroll = {current: 0}
