import {unstable__closeModal} from './modals'
import {unstable__closeLightbox} from './lightbox'
import {unstable__closeComposer} from './shell/composer'
import {unstable__closeDrawer} from './shell/drawer-open'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function closeAnyActiveElement(): boolean {
  if (unstable__closeLightbox()) {
    return true
  }
  if (unstable__closeModal()) {
    return true
  }
  if (unstable__closeComposer()) {
    return true
  }
  if (unstable__closeDrawer()) {
    return true
  }
  return false
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function closeAllActiveElements() {
  while (unstable__closeLightbox()) {}
  while (unstable__closeModal()) {}
  while (unstable__closeComposer()) {}
  while (unstable__closeDrawer()) {}
}
