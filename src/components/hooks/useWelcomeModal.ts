import {useEffect, useState} from 'react'

import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'

export function useWelcomeModal() {
  const {hasSession} = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  useEffect(() => {
    // Only show modal if:
    // 1. User is not logged in
    // 2. We haven't shown it yet in this session
    // 3. We're on the web (this is a web-only feature)
    // 4. We're on the homepage (path is '/' or '/home')
    if (
      isWeb &&
      !hasSession &&
      sessionStorage.getItem('welcomeModalShown') !== 'true' &&
      typeof window !== 'undefined'
    ) {
      const currentPath = window.location.pathname
      const isHomePage = currentPath === '/'

      if (isHomePage) {
        // Small delay to ensure the page has loaded
        const timer = setTimeout(() => {
          open()
          sessionStorage.setItem('welcomeModalShown', 'true')
        }, 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [hasSession])

  return {isOpen, open, close}
}
