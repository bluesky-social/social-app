import { StackActions, useNavigation } from '@react-navigation/native';
import { router } from '#/routes';
export function useGoBack(onGoBack) {
    var navigation = useNavigation();
    return function () {
        var _a;
        onGoBack === null || onGoBack === void 0 ? void 0 : onGoBack();
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        else {
            navigation.navigate('HomeTab');
            // Checking the state for routes ensures that web doesn't encounter errors while going back
            if ((_a = navigation.getState()) === null || _a === void 0 ? void 0 : _a.routes) {
                navigation.dispatch(StackActions.push.apply(StackActions, router.matchPath('/')));
            }
            else {
                navigation.navigate('HomeTab');
                navigation.dispatch(StackActions.popToTop());
            }
        }
    };
}
