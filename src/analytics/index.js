var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { Logger } from '#/logger';
import { Features, features as feats, init, refresh, setAttributes, } from '#/analytics/features';
import { getAndMigrateDeviceId, getDeviceId, getInitialSessionId, useSessionId, } from '#/analytics/identifiers';
import { getMetadataForLogger, getNavigationMetadata, } from '#/analytics/metadata';
import { metrics } from '#/analytics/metrics';
import * as refParams from '#/analytics/misc/refParams';
import * as env from '#/env';
import { useGeolocation } from '#/geolocation';
import { device } from '#/storage';
export * as utils from '#/analytics/utils';
export var features = { init: init, refresh: refresh };
export { Features } from '#/analytics/features';
function createLogger(context, metadata) {
    var logger = Logger.create(context, metadata);
    return {
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        log: logger.log.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        useChild: function (context) {
            return useMemo(function () { return createLogger(context, metadata); }, [context, metadata]);
        },
        Context: Logger.Context,
    };
}
var Context = createContext({
    logger: createLogger(Logger.Context.Default, {}),
    metric: function (event, payload, metadata) {
        if (metadata && '__meta' in metadata) {
            delete metadata.__meta;
        }
        metrics.track(event, payload, __assign(__assign({}, metadata), { navigation: getNavigationMetadata() }));
    },
    metadata: {
        base: {
            deviceId: (_a = getDeviceId()) !== null && _a !== void 0 ? _a : 'unknown',
            sessionId: getInitialSessionId(),
            platform: Platform.OS,
            appVersion: env.APP_VERSION,
            bundleIdentifier: env.BUNDLE_IDENTIFIER,
            bundleDate: env.BUNDLE_DATE,
            referrerSrc: refParams.src,
            referrerUrl: refParams.url,
        },
        geolocation: device.get(['mergedGeolocation']) || {
            countryCode: '',
            regionCode: '',
        },
    },
});
/**
 * Ensures that deviceId is set and migrated from legacy storage. Handled on
 * startup in `App.<platform>.tsx`. This must be awaited prior to the app
 * booting up.
 */
export var setupDeviceId = getAndMigrateDeviceId();
/**
 * Analytics context provider. Decorates the parent analytics context with
 * additional metadata. Nesting should be done carefully and sparingly.
 */
export function AnalyticsContext(_a) {
    var children = _a.children, metadata = _a.metadata;
    if (metadata) {
        if (!('__meta' in metadata)) {
            throw new Error('Use the useMeta() helper when passing metadata to AnalyticsContext');
        }
    }
    var sessionId = useSessionId();
    var geolocation = useGeolocation();
    var parentContext = useContext(Context);
    var childContext = useMemo(function () {
        var combinedMetadata = __assign(__assign(__assign({}, parentContext.metadata), metadata), { base: __assign(__assign({}, parentContext.metadata.base), { sessionId: sessionId }), geolocation: geolocation });
        var context = __assign(__assign({}, parentContext), { logger: createLogger(Logger.Context.Default, getMetadataForLogger(combinedMetadata)), metadata: combinedMetadata, metric: function (event, payload, extraMetadata) {
                parentContext.metric(event, payload, __assign(__assign({}, combinedMetadata), extraMetadata));
            } });
        return context;
    }, [sessionId, geolocation, parentContext, metadata]);
    return _jsx(Context.Provider, { value: childContext, children: children });
}
/**
 * Feature gates provider. Decorates the parent analytics context with
 * feature gate capabilities. Should be mounted within `AnalyticsContext`,
 * and below the `<Fragment key={did} />` breaker in `App.<platform>.tsx`.
 */
export function AnalyticsFeaturesContext(_a) {
    var children = _a.children;
    var parentContext = useContext(Context);
    /**
     * Side-effect: we need to synchronously set this during the
     * same render cycle. It does not trigger a re-render, it just
     * sets properties on the singleton GrowthBook instance.
     */
    setAttributes(parentContext.metadata);
    useEffect(function () {
        feats.setTrackingCallback(function (experiment, result) {
            parentContext.metric('experiment:viewed', {
                experimentId: experiment.key,
                variationId: result.key,
            });
        });
    }, [parentContext.metric]);
    var childContext = useMemo(function () {
        return __assign(__assign({}, parentContext), { features: __assign({ enabled: feats.isOn.bind(feats) }, Features) });
    }, [parentContext]);
    return _jsx(Context.Provider, { value: childContext, children: children });
}
/**
 * Basic analytics context without feature gates. Should really only be used
 * above the `AnalyticsFeaturesContext` provider.
 */
export function useAnalyticsBase() {
    return useContext(Context);
}
/**
 * The main analytics context, including feature gates. Use this everywhere you
 * need metrics, features, or logging within the React tree.
 */
export function useAnalytics() {
    var ctx = useContext(Context);
    if (!('features' in ctx)) {
        throw new Error('useAnalytics must be used within an AnalyticsFeaturesContext');
    }
    return ctx;
}
