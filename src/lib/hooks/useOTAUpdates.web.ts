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
