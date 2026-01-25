import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesomeIcon, } from '@fortawesome/react-native-fontawesome';
import { Trans } from '@lingui/macro';
import { useNavigation } from '@react-navigation/native';
import { DISCOVER_FEED_URI } from '#/lib/constants';
import { usePalette } from '#/lib/hooks/usePalette';
import { MagnifyingGlassIcon } from '#/lib/icons';
import { s } from '#/lib/styles';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useSession } from '#/state/session';
import { useAnalytics } from '#/analytics';
import { IS_WEB } from '#/env';
import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
export function CustomFeedEmptyState() {
    var ax = useAnalytics();
    var feedFeedback = useFeedFeedbackContext();
    var currentAccount = useSession().currentAccount;
    var hasLoggedDiscoverEmptyErrorRef = React.useRef(false);
    useEffect(function () {
        // Log the empty feed error event
        if (feedFeedback.feedSourceInfo && (currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did)) {
            var uri = feedFeedback.feedSourceInfo.uri;
            if (uri === DISCOVER_FEED_URI &&
                !hasLoggedDiscoverEmptyErrorRef.current) {
                hasLoggedDiscoverEmptyErrorRef.current = true;
                ax.metric('feed:discover:emptyError', {
                    userDid: currentAccount.did,
                });
            }
        }
    }, [feedFeedback.feedSourceInfo, currentAccount === null || currentAccount === void 0 ? void 0 : currentAccount.did]);
    var pal = usePalette('default');
    var palInverted = usePalette('inverted');
    var navigation = useNavigation();
    var onPressFindAccounts = React.useCallback(function () {
        if (IS_WEB) {
            navigation.navigate('Search', {});
        }
        else {
            navigation.navigate('SearchTab');
            navigation.popToTop();
        }
    }, [navigation]);
    return (_jsxs(View, { style: styles.emptyContainer, children: [_jsx(View, { style: styles.emptyIconContainer, children: _jsx(MagnifyingGlassIcon, { style: [styles.emptyIcon, pal.text], size: 62 }) }), _jsx(Text, { type: "xl-medium", style: [s.textCenter, pal.text], children: _jsx(Trans, { children: "This feed is empty! You may need to follow more users or tune your language settings." }) }), _jsxs(Button, { type: "inverted", style: styles.emptyBtn, onPress: onPressFindAccounts, children: [_jsx(Text, { type: "lg-medium", style: palInverted.text, children: _jsx(Trans, { children: "Find accounts to follow" }) }), _jsx(FontAwesomeIcon, { icon: "angle-right", style: palInverted.text, size: 14 })] })] }));
}
var styles = StyleSheet.create({
    emptyContainer: {
        height: '100%',
        paddingVertical: 40,
        paddingHorizontal: 30,
    },
    emptyIconContainer: {
        marginBottom: 16,
    },
    emptyIcon: {
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    emptyBtn: {
        marginVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    feedsTip: {
        position: 'absolute',
        left: 22,
    },
    feedsTipArrow: {
        marginLeft: 32,
        marginTop: 8,
    },
});
