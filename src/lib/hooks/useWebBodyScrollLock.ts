import {useEffect} from 'react'
import {isWeb} from '#/platform/detection'

let refCount = 0

function incrementRefCount() {
  if (refCount === 0) {
    document.body.style.overflow = 'hidden'
  }
  refCount++
}

function decrementRefCount() {
  refCount--
  if (refCount === 0) {
    document.body.style.overflow = ''
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
