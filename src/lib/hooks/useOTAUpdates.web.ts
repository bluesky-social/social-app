export function useOTAUpdates() {}
export function useApplyPullRequestOTAUpdate() {
  return {
    tryApplyUpdate: async (_channel: string) => {},
    revertToEmbedded: () => {},
    isCurrentlyRunningPullRequestDeployment: false,
    currentChannel: 'web-build',
    pending: false,
  }
}
/**
 * There are no OTA updates on web, so the runtime is never one we reloaded into.
 */
export function consumeOTAReloadMarker() {
  return false
}
