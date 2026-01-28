import {useEffect, useState} from 'react'

import {useSession} from '#/state/session'
import {IS_WEB} from '#/env'

export function useWelcomeModal() {
  const {hasSession} = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  useEffect(() => {
    // Only show modal if:
    // 1. User is not logged in
    // 2. We're on the web (this is a web-only feature)
    // 3. We're on the homepage (path is '/' or '/home')
    // 4. Modal hasn't been shown before
    if (IS_WEB && !hasSession && typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isHomePage = currentPath === '/'
      const hasModalBeenShown =
        localStorage.getItem('welcomeModalShown') === 'true'

      if (isHomePage && !hasModalBeenShown) {
        // Mark that the modal has been shown, don't show again
        localStorage.setItem('welcomeModalShown', 'true')
        // Small delay to ensure the page has loaded
        const timer = setTimeout(() => {
          open()
        }, 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [hasSession])

  return {isOpen, open, close}
}
