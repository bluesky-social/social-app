import { useMemo } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function useAppIconSets() {
    var _ = useLingui()._;
    return useMemo(function () {
        var defaults = [
            {
                id: 'default_light',
                name: _(msg({ context: 'Name of app icon variant', message: 'Light' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_legacy_light.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_legacy_light.png");
                },
            },
            {
                id: 'default_dark',
                name: _(msg({ context: 'Name of app icon variant', message: 'Dark' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_legacy_dark.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_legacy_dark.png");
                },
            },
        ];
        /**
         * Bluesky+
         */
        var core = [
            {
                id: 'core_aurora',
                name: _(msg({ context: 'Name of app icon variant', message: 'Aurora' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_aurora.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_aurora.png");
                },
            },
            // {
            //   id: 'core_bonfire',
            //   name: _(msg({ context: 'Name of app icon variant', message: 'Bonfire' })),
            //   iosImage: () => {
            //     return require(`../../../../assets/app-icons/ios_icon_core_bonfire.png`)
            //   },
            //   androidImage: () => {
            //     return require(`../../../../assets/app-icons/android_icon_core_bonfire.png`)
            //   },
            // },
            {
                id: 'core_sunrise',
                name: _(msg({ context: 'Name of app icon variant', message: 'Sunrise' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_sunrise.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_sunrise.png");
                },
            },
            {
                id: 'core_sunset',
                name: _(msg({ context: 'Name of app icon variant', message: 'Sunset' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_sunset.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_sunset.png");
                },
            },
            {
                id: 'core_midnight',
                name: _(msg({ context: 'Name of app icon variant', message: 'Midnight' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_midnight.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_midnight.png");
                },
            },
            {
                id: 'core_flat_blue',
                name: _(msg({ context: 'Name of app icon variant', message: 'Flat Blue' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_flat_blue.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_flat_blue.png");
                },
            },
            {
                id: 'core_flat_white',
                name: _(msg({ context: 'Name of app icon variant', message: 'Flat White' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_flat_white.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_flat_white.png");
                },
            },
            {
                id: 'core_flat_black',
                name: _(msg({ context: 'Name of app icon variant', message: 'Flat Black' })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_flat_black.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_flat_black.png");
                },
            },
            {
                id: 'core_classic',
                name: _(msg({
                    context: 'Name of app icon variant',
                    message: 'Bluesky Classic™',
                })),
                iosImage: function () {
                    return require("../../../../assets/app-icons/ios_icon_core_classic.png");
                },
                androidImage: function () {
                    return require("../../../../assets/app-icons/android_icon_core_classic.png");
                },
            },
        ];
        return {
            defaults: defaults,
            core: core,
        };
    }, [_]);
}
