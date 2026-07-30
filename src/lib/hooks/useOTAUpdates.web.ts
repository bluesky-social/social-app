export function useOTAUpdates() {}
export function useApplyPullRequestOTAUpdate() {
  return {
    tryApplyUpdate: async (_channel: string) => {},
    restoreDefaultChannel: async () => {},
    isCurrentlyRunningPullRequestDeployment: false,
    isCurrentlyRunningNonStandardChannel: false,
    currentChannel: 'web-build',
    defaultChannel: 'web-build',
    pending: false,
  }
}
