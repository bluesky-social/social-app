import {createPortalGroup} from '#/components/Portal'

/**
 * Renders into the home header on larger web layouts, directly below the
 * sticky tab bar. Lets the Following feed pin its "N new posts" pill under
 * the bar regardless of scroll position.
 */
const group = createPortalGroup()

export const Provider = group.Provider
export const Outlet = group.Outlet
export const Portal = group.Portal
