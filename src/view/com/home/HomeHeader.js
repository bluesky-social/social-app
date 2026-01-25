import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '#/state/session';
import { TabBar } from '../pager/TabBar';
import { HomeHeaderLayout } from './HomeHeaderLayout';
export function HomeHeader(props) {
    var feeds = props.feeds, onSelectProp = props.onSelect;
    var hasSession = useSession().hasSession;
    var navigation = useNavigation();
    var hasPinnedCustom = React.useMemo(function () {
        if (!hasSession)
            return false;
        return feeds.some(function (tab) {
            var isFollowing = tab.uri === 'following';
            return !isFollowing;
        });
    }, [feeds, hasSession]);
    var items = React.useMemo(function () {
        var pinnedNames = feeds.map(function (f) { return f.displayName; });
        if (!hasPinnedCustom) {
            return pinnedNames.concat('Feeds ✨');
        }
        return pinnedNames;
    }, [hasPinnedCustom, feeds]);
    var onPressFeedsLink = React.useCallback(function () {
        navigation.navigate('Feeds');
    }, [navigation]);
    var onSelect = React.useCallback(function (index) {
        if (!hasPinnedCustom && index === items.length - 1) {
            onPressFeedsLink();
        }
        else if (onSelectProp) {
            onSelectProp(index);
        }
    }, [items.length, onPressFeedsLink, onSelectProp, hasPinnedCustom]);
    return (_jsx(HomeHeaderLayout, { tabBarAnchor: props.tabBarAnchor, children: _jsx(TabBar, { onPressSelected: props.onPressSelected, selectedPage: props.selectedPage, onSelect: onSelect, testID: props.testID, items: items, dragProgress: props.dragProgress, dragState: props.dragState, transparent: true }, items.join(',')) }));
}
