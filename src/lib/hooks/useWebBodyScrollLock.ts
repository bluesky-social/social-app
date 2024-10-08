import {useEffect} from 'react'

import {isWeb} from '#/platform/detection'

let refCount = 0

function incrementRefCount() {
  if (refCount === 0) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.scrollbarGutter = 'auto'
  }
  refCount++
}

function decrementRefCount() {
  refCount--
  if (refCount === 0) {
    document.body.style.overflow = ''
    document.documentElement.style.scrollbarGutter = ''
  }
}

export function useWebBodyScrollLock(isLockActive: boolean) {
  useEffect(() => {
    if (!isWeb || !isLockActive) {
      return
    }
    incrementRefCount()
    return () => decrementRefCount()
  })
}
