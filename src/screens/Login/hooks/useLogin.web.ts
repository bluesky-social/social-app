import React from 'react'

export function useLogin(serviceUrl: string | undefined) {
  const openAuthSession = React.useCallback(async () => {
    if (!serviceUrl) return

    window.location.href = serviceUrl
  }, [serviceUrl])

  return {
    openAuthSession,
  }
}
