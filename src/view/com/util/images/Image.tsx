import {Image, type ImageProps, type ImageSource} from 'expo-image'

interface HighPriorityImageProps extends ImageProps {
  source: ImageSource
}
export function HighPriorityImage({source, ...props}: HighPriorityImageProps) {
  const updatedSource = {
    uri: typeof source === 'object' && source ? source.uri : '',
  } satisfies ImageSource
  return (
    <Image accessibilityIgnoresInvertColors source={updatedSource} {...props} />
  )
}
