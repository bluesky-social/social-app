import {ID} from '#/components/PolicyUpdateOverlay/updates/202508/config'

/**
 * The singulary active update ID. This is configured here to ensure that
 * the relationship is clear.
 */
export const ACTIVE_UPDATE_ID = ID

/**
 * Toggle to enable or disable the policy update overlay feature e.g. once an
 * update has run its course, set this to false. For new updates, set this to
 * true and change `ACTIVE_UPDATE_ID` to the new update ID.
 */
export const POLICY_UPDATE_IS_ENABLED = false
