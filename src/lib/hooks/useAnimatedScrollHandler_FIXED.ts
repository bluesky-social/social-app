// Be warned. This Hook is very buggy unless used in a very constrained way.
// To use it safely:
//
// - DO NOT pass its return value as a prop to any user-defined component.
// - DO NOT pass its return value to more than a single component.
//
// In other words, the only safe way to use it is next to the leaf Reanimated View.
//
// Relevant bug reports:
// - https://github.com/software-mansion/react-native-reanimated/issues/5345
// - https://github.com/software-mansion/react-native-reanimated/issues/5360
// - https://github.com/software-mansion/react-native-reanimated/issues/5364
//
// It's great when it works though.
export {useAnimatedScrollHandler} from 'react-native-reanimated'
