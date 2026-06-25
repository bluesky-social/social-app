/**
 * Peer-moderation gating.
 *
 * Real peer-mod badge issuance is a separate, unstarted feature. Until it
 * lands, this is a single mock toggle so the "Label post" flow can be tested
 * as if the signed-in user holds a peer-mod badge. Flip to false to hide the
 * flow. When badge issuance ships, replace this with the real check — callers
 * won't change.
 */
export const ISPEERMOD = true
