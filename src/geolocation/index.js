import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, } from 'react';
import { useSyncDeviceGeolocationOnStartup } from '#/geolocation/device';
import { useGeolocationServiceResponse } from '#/geolocation/service';
import { mergeGeolocations } from '#/geolocation/util';
import { device, useStorage } from '#/storage';
export { useIsDeviceGeolocationGranted, useRequestDeviceGeolocation, } from '#/geolocation/device';
export { resolve } from '#/geolocation/service';
export * from '#/geolocation/types';
var GeolocationContext = createContext({
    countryCode: undefined,
    regionCode: undefined,
});
var DeviceGeolocationAPIContext = createContext({
    setDeviceGeolocation: function () { },
});
export function useGeolocation() {
    return useContext(GeolocationContext);
}
export function useDeviceGeolocationApi() {
    return useContext(DeviceGeolocationAPIContext);
}
export function Provider(_a) {
    var children = _a.children;
    var geolocationService = useGeolocationServiceResponse();
    var _b = useStorage(device, [
        'deviceGeolocation',
    ]), deviceGeolocation = _b[0], setDeviceGeolocation = _b[1];
    var geolocation = useMemo(function () {
        return mergeGeolocations(deviceGeolocation, geolocationService);
    }, [deviceGeolocation, geolocationService]);
    useEffect(function () {
        /**
         * Save this for out-of-band-reads during future cold starts of the app.
         * Needs to be available for the data prefetching we do on boot.
         */
        device.set(['mergedGeolocation'], geolocation);
    }, [geolocation]);
    useSyncDeviceGeolocationOnStartup(setDeviceGeolocation);
    return (_jsx(GeolocationContext.Provider, { value: geolocation, children: _jsx(DeviceGeolocationAPIContext.Provider, { value: useMemo(function () { return ({ setDeviceGeolocation: setDeviceGeolocation }); }, [setDeviceGeolocation]), children: children }) }));
}
