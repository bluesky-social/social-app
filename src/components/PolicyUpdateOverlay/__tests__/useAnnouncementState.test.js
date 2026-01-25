import { describe, test } from '@jest/globals';
import { computeCompletedState, syncCompletedState, } from '#/components/PolicyUpdateOverlay/usePolicyUpdateState';
jest.mock('../../../state/queries/nuxs');
describe('computeCompletedState', function () {
    test("initial state", function () {
        var completed = computeCompletedState({
            nuxIsReady: false,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: false,
            completedForDevice: undefined,
        });
        expect(completed).toBe(true);
    });
    test("nux loaded state", function () {
        var completed = computeCompletedState({
            nuxIsReady: true,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: false,
            completedForDevice: undefined,
        });
        expect(completed).toBe(false);
    });
    test("nux saving state", function () {
        var completed = computeCompletedState({
            nuxIsReady: true,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: true,
            completedForDevice: undefined,
        });
        expect(completed).toBe(true);
    });
    test("nux is completed", function () {
        var completed = computeCompletedState({
            nuxIsReady: true,
            nuxIsCompleted: true,
            nuxIsOptimisticallyCompleted: false,
            completedForDevice: undefined,
        });
        expect(completed).toBe(true);
    });
    test("initial state, but already completed for device", function () {
        var completed = computeCompletedState({
            nuxIsReady: false,
            nuxIsCompleted: false,
            nuxIsOptimisticallyCompleted: false,
            completedForDevice: true,
        });
        expect(completed).toBe(true);
    });
});
describe('syncCompletedState', function () {
    describe('!nuxIsReady', function () {
        test("!completedForDevice, no-op", function () {
            var save = jest.fn();
            var setCompletedForDevice = jest.fn();
            syncCompletedState({
                nuxIsReady: false,
                nuxIsCompleted: false,
                nuxIsOptimisticallyCompleted: false,
                completedForDevice: false,
                save: save,
                setCompletedForDevice: setCompletedForDevice,
            });
            expect(save).not.toHaveBeenCalled();
            expect(setCompletedForDevice).not.toHaveBeenCalled();
        });
        test("completedForDevice, no-op", function () {
            var save = jest.fn();
            var setCompletedForDevice = jest.fn();
            syncCompletedState({
                nuxIsReady: false,
                nuxIsCompleted: false,
                nuxIsOptimisticallyCompleted: false,
                completedForDevice: true,
                save: save,
                setCompletedForDevice: setCompletedForDevice,
            });
            expect(save).not.toHaveBeenCalled();
            expect(setCompletedForDevice).not.toHaveBeenCalled();
        });
    });
    describe('nuxIsReady', function () {
        describe("!nuxIsCompleted", function () {
            describe("!nuxIsOptimisticallyCompleted", function () {
                test("!completedForDevice, no-op", function () {
                    var save = jest.fn();
                    var setCompletedForDevice = jest.fn();
                    syncCompletedState({
                        nuxIsReady: true,
                        nuxIsCompleted: false,
                        nuxIsOptimisticallyCompleted: false,
                        completedForDevice: false,
                        save: save,
                        setCompletedForDevice: setCompletedForDevice,
                    });
                    expect(save).not.toHaveBeenCalled();
                    expect(setCompletedForDevice).not.toHaveBeenCalled();
                });
                test("completedForDevice, syncs to server", function () {
                    var save = jest.fn();
                    var setCompletedForDevice = jest.fn();
                    syncCompletedState({
                        nuxIsReady: true,
                        nuxIsCompleted: false,
                        nuxIsOptimisticallyCompleted: false,
                        completedForDevice: true,
                        save: save,
                        setCompletedForDevice: setCompletedForDevice,
                    });
                    expect(save).toHaveBeenCalled();
                    expect(setCompletedForDevice).not.toHaveBeenCalled();
                });
            });
            /**
             * Catches the case where we already called `save` to sync device state
             * to server, thus `nuxIsOptimisticallyCompleted` is true.
             */
            describe("nuxIsOptimisticallyCompleted", function () {
                test("completedForDevice, no-op", function () {
                    var save = jest.fn();
                    var setCompletedForDevice = jest.fn();
                    syncCompletedState({
                        nuxIsReady: true,
                        nuxIsCompleted: false,
                        nuxIsOptimisticallyCompleted: true,
                        completedForDevice: true,
                        save: save,
                        setCompletedForDevice: setCompletedForDevice,
                    });
                    expect(save).not.toHaveBeenCalled();
                    expect(setCompletedForDevice).not.toHaveBeenCalled();
                });
            });
        });
        describe("nuxIsCompleted", function () {
            test("!completedForDevice, syncs to device", function () {
                var save = jest.fn();
                var setCompletedForDevice = jest.fn();
                syncCompletedState({
                    nuxIsReady: true,
                    nuxIsCompleted: true,
                    nuxIsOptimisticallyCompleted: false,
                    completedForDevice: false,
                    save: save,
                    setCompletedForDevice: setCompletedForDevice,
                });
                expect(save).not.toHaveBeenCalled();
                expect(setCompletedForDevice).toHaveBeenCalled();
            });
            test("completedForDevice, no-op", function () {
                var save = jest.fn();
                var setCompletedForDevice = jest.fn();
                syncCompletedState({
                    nuxIsReady: true,
                    nuxIsCompleted: true,
                    nuxIsOptimisticallyCompleted: false,
                    completedForDevice: true,
                    save: save,
                    setCompletedForDevice: setCompletedForDevice,
                });
                expect(save).not.toHaveBeenCalled();
                expect(setCompletedForDevice).not.toHaveBeenCalled();
            });
        });
    });
});
