import { withDelay, withSequence, withTiming } from 'react-native-reanimated';
export function ShrinkAndPop() {
    'worklet';
    var animations = {
        opacity: withDelay(125, withTiming(0, { duration: 125 })),
        transform: [
            {
                scale: withSequence(withTiming(0.7, { duration: 75 }), withTiming(1.1, { duration: 150 })),
            },
        ],
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
