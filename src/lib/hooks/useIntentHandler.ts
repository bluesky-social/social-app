/**
 * Resources
 *
 * Overview: https://developers.google.com/analytics/devguides/collection/protocol/v1/reference#required
 * Param reference: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 * UTM reference: https://support.google.com/analytics/answer/10917952
 */

import React from 'react'
import * as Linking from 'expo-linking'

export function handleIncomingURL(url: string) {}

export function useIntentHandler() {
  const url = Linking.useURL()
  React.useEffect(() => {
    if (url) handleIncomingURL(url)
  }, [url])
}
