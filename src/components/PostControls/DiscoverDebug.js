var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { t } from '@lingui/macro';
import { DISCOVER_DEBUG_DIDS } from '#/lib/constants';
import { useSession } from '#/state/session';
import { atoms as a, useTheme } from '#/alf';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';
import { useAnalytics } from '#/analytics';
import { IS_INTERNAL } from '#/env';
export function DiscoverDebug(_a) {
    var feedContext = _a.feedContext;
    var ax = useAnalytics();
    var currentAccount = useSession().currentAccount;
    var isDiscoverDebugUser = IS_INTERNAL ||
        DISCOVER_DEBUG_DIDS[(currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did) || ''] ||
        ax.features.enabled(ax.features.DebugFeedContext);
    var theme = useTheme();
    return (isDiscoverDebugUser &&
        feedContext && (_jsx(Pressable, { accessible: false, hitSlop: 10, style: [a.absolute, { zIndex: 1000, maxWidth: 65, bottom: -4 }, a.left_0], onPress: function (e) {
            e.stopPropagation();
            Clipboard.setStringAsync(feedContext);
            Toast.show(t(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Copied to clipboard"], ["Copied to clipboard"]))));
        }, children: _jsx(Text, { numberOfLines: 1, style: {
                color: theme.palette.contrast_400,
                fontSize: 7,
            }, children: feedContext }) })));
}
var templateObject_1;
