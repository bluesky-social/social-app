"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIntentFilters = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var withIntentFilters = function (config) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return (0, config_plugins_1.withAndroidManifest)(config, function (config) {
        var _a, _b;
        var intents = [
            {
                action: [
                    {
                        $: {
                            'android:name': 'android.intent.action.SEND',
                        },
                    },
                ],
                category: [
                    {
                        $: {
                            'android:name': 'android.intent.category.DEFAULT',
                        },
                    },
                ],
                data: [
                    {
                        $: {
                            'android:mimeType': 'image/*',
                        },
                    },
                ],
            },
            {
                action: [
                    {
                        $: {
                            'android:name': 'android.intent.action.SEND',
                        },
                    },
                ],
                category: [
                    {
                        $: {
                            'android:name': 'android.intent.category.DEFAULT',
                        },
                    },
                ],
                data: [
                    {
                        $: {
                            'android:mimeType': 'text/plain',
                        },
                    },
                ],
            },
            {
                action: [
                    {
                        $: {
                            'android:name': 'android.intent.action.SEND_MULTIPLE',
                        },
                    },
                ],
                category: [
                    {
                        $: {
                            'android:name': 'android.intent.category.DEFAULT',
                        },
                    },
                ],
                data: [
                    {
                        $: {
                            'android:mimeType': 'image/*',
                        },
                    },
                ],
            },
        ];
        var intentFilter = (_b = (_a = config.modResults.manifest.application) === null || _a === void 0 ? void 0 : _a[0].activity) === null || _b === void 0 ? void 0 : _b[0]['intent-filter'];
        if (intentFilter) {
            intentFilter.push.apply(intentFilter, intents);
        }
        return config;
    });
};
exports.withIntentFilters = withIntentFilters;
