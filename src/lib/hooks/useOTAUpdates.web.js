export function useOTAUpdates() { }
export function useApplyPullRequestOTAUpdate() {
    return {
        tryApplyUpdate: function () { },
        revertToEmbedded: function () { },
        isCurrentlyRunningPullRequestDeployment: false,
        currentChannel: 'web-build',
        pending: false,
    };
}
