import { useMemo } from 'react';
import { useNux, useSaveNux } from '#/state/queries/nuxs';
import { ACTIVE_UPDATE_ID } from '#/components/PolicyUpdateOverlay/config';
import { logger } from '#/components/PolicyUpdateOverlay/logger';
import { IS_DEV } from '#/env';
import { device, useStorage } from '#/storage';
export function usePolicyUpdateState(_a) {
    var enabled = _a.enabled;
    var nux = useNux(ACTIVE_UPDATE_ID);
    var _b = useSaveNux(), save = _b.mutate, variables = _b.variables;
    var deviceStorage = useStorage(device, [ACTIVE_UPDATE_ID]);
    var debugOverride = !!useStorage(device, ['policyUpdateDebugOverride'])[0] && IS_DEV;
    return useMemo(function () {
        var _a;
        /**
         * If not enabled, then just return a completed state so the app functions
         * as normal.
         */
        if (!enabled) {
            return {
                completed: true,
                complete: function () { },
            };
        }
        var nuxIsReady = nux.status === 'ready';
        var nuxIsCompleted = ((_a = nux.nux) === null || _a === void 0 ? void 0 : _a.completed) === true;
        var nuxIsOptimisticallyCompleted = !!(variables === null || variables === void 0 ? void 0 : variables.completed);
        var completedForDevice = deviceStorage[0], setCompletedForDevice = deviceStorage[1];
        var completed = computeCompletedState({
            nuxIsReady: nuxIsReady,
            nuxIsCompleted: nuxIsCompleted,
            nuxIsOptimisticallyCompleted: nuxIsOptimisticallyCompleted,
            completedForDevice: completedForDevice,
        });
        logger.debug("state", {
            completed: completed,
            nux: nux,
            completedForDevice: completedForDevice,
        });
        if (!debugOverride) {
            syncCompletedState({
                nuxIsReady: nuxIsReady,
                nuxIsCompleted: nuxIsCompleted,
                nuxIsOptimisticallyCompleted: nuxIsOptimisticallyCompleted,
                completedForDevice: completedForDevice,
                save: save,
                setCompletedForDevice: setCompletedForDevice,
            });
        }
        return {
            completed: completed,
            complete: function () {
                logger.debug("user completed");
                save({
                    id: ACTIVE_UPDATE_ID,
                    completed: true,
                    data: undefined,
                });
                setCompletedForDevice(true);
            },
        };
    }, [enabled, nux, save, variables, deviceStorage, debugOverride]);
}
export function computeCompletedState(_a) {
    var nuxIsReady = _a.nuxIsReady, nuxIsCompleted = _a.nuxIsCompleted, nuxIsOptimisticallyCompleted = _a.nuxIsOptimisticallyCompleted, completedForDevice = _a.completedForDevice;
    /**
     * Assume completed to prevent flash
     */
    var completed = true;
    /**
     * Prefer server state, if available
     */
    if (nuxIsReady) {
        completed = nuxIsCompleted;
    }
    /**
     * Override with optimistic state or device state
     */
    if (nuxIsOptimisticallyCompleted || !!completedForDevice) {
        completed = true;
    }
    return completed;
}
export function syncCompletedState(_a) {
    var nuxIsReady = _a.nuxIsReady, nuxIsCompleted = _a.nuxIsCompleted, nuxIsOptimisticallyCompleted = _a.nuxIsOptimisticallyCompleted, completedForDevice = _a.completedForDevice, save = _a.save, setCompletedForDevice = _a.setCompletedForDevice;
    /*
     * Sync device state to server state for this account
     */
    if (nuxIsReady &&
        !nuxIsCompleted &&
        !nuxIsOptimisticallyCompleted &&
        !!completedForDevice) {
        logger.debug("syncing device state to server state");
        save({
            id: ACTIVE_UPDATE_ID,
            completed: true,
            data: undefined,
        });
    }
    else if (nuxIsReady && nuxIsCompleted && !completedForDevice) {
        logger.debug("syncing server state to device state");
        /*
         * Sync server state to device state
         */
        setCompletedForDevice(true);
    }
}
