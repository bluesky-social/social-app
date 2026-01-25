export function wrapSessionReducerForLogging(reducer) {
    return function loggingWrapper(prevState, action) {
        var nextState = reducer(prevState, action);
        addSessionDebugLog({ type: 'reducer:call', prevState: prevState, action: action, nextState: nextState });
        return nextState;
    };
}
/**
 * Stubs, previously used to log session errors to Statsig. We may revive this
 * using Sentry or Bitdrift in the future.
 */
export function addSessionErrorLog(_did, _event) { }
export function addSessionDebugLog(_log) { }
