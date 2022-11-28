import Toast from 'react-native-root-toast'

export function show(message: string) {
  Toast.show(message, {
    duration: Toast.durations.LONG,
    position: 50,
    shadow: true,
    animation: true,
    hideOnPress: true,
  })
}
