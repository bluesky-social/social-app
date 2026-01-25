import { withTiming } from 'react-native-reanimated';
export function ScaleAndFadeIn() {
    'worklet';
    var animations = {
        opacity: withTiming(1),
        transform: [{ scale: withTiming(1) }],
    };
    var initialValues = {
        opacity: 0,
        transform: [{ scale: 0.7 }],
    };
    return {
        animations: animations,
        initialValues: initialValues,
    };
}
export function ScaleAndFadeOut() {
    'worklet';
    var animations = {
        opacity: withTiming(0),
        transform: [{ scale: withTiming(0.7) }],
    };
    var initialValues = {
        opacity: 1,
        transform: [{ scale: 1 }],
    };
    return {
        animations: animations,
        initialValues: initialValues,
    };
}
