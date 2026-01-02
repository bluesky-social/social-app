export function useOTAUpdates() {}
export function useApplyPullRequestOTAUpdate() {
  return {
    tryApplyUpdate: () => {},
    revertToEmbedded: () => {},
    isCurrentlyRunningPullRequestDeployment: false,
    currentChannel: 'web-build',
    pending: false,
  }
}
