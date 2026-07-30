export function useOTAUpdates() {}
export function useOTAUpdateRecovery() {}
export function useApplyPullRequestOTAUpdate() {
  return {
    tryApplyUpdate: async (
      _channel: string,
      _declaredAppVersion?: string | null,
    ) => {},
    restoreDefaultChannel: async () => {},
    isCurrentlyRunningPullRequestDeployment: false,
    isCurrentlyRunningNonStandardChannel: false,
    currentChannel: 'web-build',
    defaultChannel: 'web-build',
    pending: false,
  }
}
